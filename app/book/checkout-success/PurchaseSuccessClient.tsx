// app/book/checkout-success/PurchaseSuccessClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PurchaseSuccessClient({
  sessionId,
}: {
  sessionId: string | null;
}) {
  const [saved, setSaved] = useState<"idle" | "ok" | "ng">("idle");

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        const res = await fetch("/api/checkout/success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        setSaved(data?.ok ? "ok" : "ng");
      } catch {
        setSaved("ng");
      }
    })();
  }, [sessionId]);

  return (
    <div className="flex items-center justify-center mt-20">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          購入ありがとうございます！
        </h1>
        <p className="text-center text-gray-600 mb-2">
          {saved === "ok" && "購入履歴を保存しました。"}
          {saved === "ng" && "購入履歴の保存に失敗しました。"}
          {saved === "idle" && "処理中です…"}
        </p>
        <div className="mt-6 text-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800">
            購入した記事を読む
          </Link>
        </div>
      </div>
    </div>
  );
}
