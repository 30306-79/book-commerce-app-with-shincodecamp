import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json(
        { error: "session_id required" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    // ★ 支払い完了のみ保存
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { ok: false, reason: "payment not paid" },
        { status: 200 }
      );
    }

    const userId = session.client_reference_id!;
    const bookId = session.metadata?.bookId!;
    if (!userId || !bookId) {
      return NextResponse.json(
        { error: "missing userId/bookId" },
        { status: 400 }
      );
    }

    // ★ 複合ユニークで“二重購入”を物理ガード
    const purchase = await prisma.purchase.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {},
      create: { userId, bookId },
    });

    return NextResponse.json({ ok: true, purchase }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server error" },
      { status: 500 }
    );
  }
}
