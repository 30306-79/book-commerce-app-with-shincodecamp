// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const { title, price } = await req.json();
    const amount = Number(price);
    if (!title || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;

    // ★ ここで型を明示
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"], // ← ここに変更
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
