// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/app/lib/prisma"; // ★ 追加

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const { title, price, bookId, userId } = await req.json();
    const amount = Number(price);
    if (
      !title ||
      !bookId ||
      !userId ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // ★ ここで購入済みを先に弾く（Stripe セッションを作らない）
    const exists = await prisma.purchase.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ error: "ALREADY_PURCHASED" }, { status: 409 });
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

    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: any) {
    console.error("Stripe create error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
