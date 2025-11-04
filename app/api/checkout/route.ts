// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { nextAuthOptions as authOptions } from "@/app/lib/next-auth/option";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    // ✅ サーバー側でセッションを必須化（クライアントからの userId は信用しない）
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { title, price, bookId } = await req.json();
    const amount = Number(price);

    // 入力チェック
    if (!title || !bookId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // ✅ 事前に二重購入をAPIでブロック（DBユニークに加えてアプリ層でも明確に拒否）
    const existing = await prisma.purchase.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "already purchased", bookId },
        { status: 409 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      metadata: { bookId },
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: { name: title },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/book/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: origin,
    };

    const checkout = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: checkout.url }, { status: 200 });
  } catch (e: any) {
    console.error("Stripe create error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
