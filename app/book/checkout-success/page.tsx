// app/book/checkout-success/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PurchaseSuccess({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const [bookId, setBookId] = useState<string | null>(null);

  useEffect(() => {
    const sid = searchParams?.session_id;
    if (!sid) return;
    (async () => {
      const res = await fetch("/api/checkout/success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid }),
      });
      const data = await res.json();
      // /api/checkout/success で upsert 済み。StripeのmetadataからbookIdを返すようにしておく
      // 返ってこない場合は再取得してもOK
      setBookId(data?.purchase?.bookId ?? data?.bookId ?? null);
    })();
  }, [searchParams?.session_id]);

  return (
    <div className="flex items-center justify-center mt-20">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          購入ありがとうございます！
        </h1>
        <p className="text-center text-gray-600">
          ご購入の詳細は登録メールへ送信されます。
        </p>
        <div className="mt-6 text-center">
          {bookId ? (
            <Link
              href={`/book/${bookId}`}
              className="text-indigo-600 hover:text-indigo-800 transition"
            >
              購入した記事を読む
            </Link>
          ) : (
            <span className="text-gray-400">購入データを反映中…</span>
          )}
        </div>
      </div>
    </div>
  );
}
