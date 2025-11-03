// app/api/checkout/success/route.ts
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

    // Stripeセッションを取得
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // 決済完了のみ保存対象
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { ok: false, reason: "payment not paid" },
        { status: 200 }
      );
    }

    const userId = session.client_reference_id ?? "";
    const bookId = session.metadata?.bookId ?? "";
    if (!userId || !bookId) {
      return NextResponse.json(
        { error: "missing userId/bookId" },
        { status: 400 }
      );
    }

    // 二重購入ガード（複合ユニーク: userId+bookId）
    const purchase = await prisma.purchase.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {}, // 既存なら何も更新しない（idempotent）
      create: { userId, bookId },
    });

    // フロントでリンクを作れるように bookId も返す
    return NextResponse.json({ ok: true, purchase, bookId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server error" },
      { status: 500 }
    );
  }
}
