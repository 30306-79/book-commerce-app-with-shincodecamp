// app/book/checkout-success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PurchaseSuccess() {
  const searchParams = useSearchParams();

  // ✅ .get() で取得（直接プロパティアクセス禁止）
  const sessionId = searchParams.get("session_id");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let aborted = false;
    (async () => {
      try {
        setSaving(true);
        setError(null);

        const res = await fetch("/api/checkout/success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
          cache: "no-store",
        });

        const data = await res.json();
        if (aborted) return;

        if (!res.ok || data?.error) {
          throw new Error(data?.error || "購入履歴の保存に失敗しました");
        }

        setBookId(data?.purchase?.bookId ?? null);
      } catch (e: any) {
        if (!aborted) setError(e?.message ?? "エラーが発生しました");
      } finally {
        if (!aborted) setSaving(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [sessionId]); // ✅ searchParamsではなくsessionIdを依存に

  return (
    <div className="flex items-center justify-center mt-20">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-3">
          購入ありがとうございます！
        </h1>

        {saving && (
          <p className="text-center text-gray-600">
            購入履歴を保存しています...
          </p>
        )}

        {!saving && error && (
          <p className="text-center text-red-600">保存エラー: {error}</p>
        )}

        {!saving && !error && (
          <>
            <p className="text-center text-gray-600 mb-4">
              ご購入内容の詳細は登録メールに送信されます。
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Link
                href={bookId ? `/book/${bookId}` : "#"}
                className={`px-4 py-2 rounded text-white ${
                  bookId
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                aria-disabled={!bookId}
              >
                購入した記事を読む
              </Link>

              <Link
                href="/"
                className="text-indigo-600 hover:text-indigo-800 transition duration-300"
              >
                トップに戻る
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
