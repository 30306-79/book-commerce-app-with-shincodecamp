// app/components/Book.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import type { BookType } from "../types/types";

export default function Book({ book }: { book: BookType }) {
  const [open, setOpen] = useState(false);
  const [purchased, setPurchased] = useState(false); // 購入済みフラグ
  const [buying, setBuying] = useState(false); // ★ 追加: 二度押し防止
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  const src =
    book.thumbnailUrl && book.thumbnailUrl.trim() ? book.thumbnailUrl : null;

  const priceText =
    typeof book.price === "number" ? `¥${book.price.toLocaleString()}` : "—";

  // 価格が正しく設定されているか（購入可否）
  const canBuy =
    typeof book.price === "number" &&
    Number.isFinite(book.price) &&
    book.price > 0;

  // 購入済み判定（ログイン状態に依存）
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`/api/purchases/has?bookId=${book.id}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!ignore) setPurchased(Boolean(data?.purchased));
      } catch {
        if (!ignore) setPurchased(false);
      }
    })();
    return () => {
      ignore = true;
    };
    // session?.user が変わるたび確認
  }, [book.id, session?.user]);

  const startCheckout = async () => {
    if (status === "unauthenticated") {
      await signIn("github");
      return;
    }

    const userId = (session?.user as any)?.id;
    const bookId = book.id;
    const title = book.title;
    const price = Number(book.price);

    if (!userId || !bookId || !title || !Number.isFinite(price) || price <= 0) {
      alert("購入情報が不足しています");
      return;
    }

    try {
      setBuying(true); // ★ 送信中ON
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, price, bookId, userId }),
      });

      if (res.status === 409) {
        // ★ サーバー側の重複チェックにヒット
        setPurchased(true);
        alert("この本はすでに購入済みです。");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout error");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert("購入処理でエラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setBuying(false); // ★ 送信中OFF
    }
  };

  // Escキーで閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 開いたらボタンにフォーカス
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  // 「購入する/読む」クリック時
  const handlePrimary = async () => {
    if (status === "loading" || buying) return;

    if (!session) {
      await signIn("github");
      return;
    }

    if (purchased) {
      // 既に購入済み → 読む導線（必要に応じて詳細ページ等へ）
      router.push(`/book/${book.id}`);
      setOpen(false);
      return;
    }

    if (!canBuy) {
      alert("この商品は現在購入できません（価格未設定）");
      return;
    }

    await startCheckout();
    setOpen(false);
  };

  return (
    <>
      {/* アニメーション */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .modal {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      <div className="flex flex-col items-center m-4">
        {/* クリックでモーダル表示 */}
        <div
          onClick={() => setOpen(true)}
          className="relative cursor-pointer shadow-2xl duration-300 hover:translate-y-1 hover:shadow-none rounded-md overflow-hidden"
          role="button"
          aria-label={`${book.title} を開く`}
        >
          {/* 購入済みリボン */}
          {purchased && (
            <span className="absolute left-2 top-2 text-xs font-semibold bg-emerald-600 text-white px-2 py-1 rounded">
              購入済み
            </span>
          )}

          {src ? (
            <Image
              priority
              src={src}
              alt={book.title ?? "thumbnail"}
              width={450}
              height={350}
              className="rounded-t-md object-cover"
            />
          ) : (
            <div className="w-[450px] h-[350px] bg-gray-200 grid place-items-center text-gray-500">
              No image
            </div>
          )}

          <div className="px-4 py-4 bg-slate-100 rounded-b-md">
            <h2 className="text-lg font-semibold line-clamp-2">{book.title}</h2>
            <p className="mt-2 text-lg text-slate-600">この本は○○...</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-md text-slate-700">値段：{priceText}</p>
              {!canBuy && (
                <span className="text-xs bg-slate-300 text-slate-700 px-2 py-0.5 rounded">
                  販売準備中
                </span>
              )}
              {purchased && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  購入済み
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- モーダル ---- */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex justify-center items-center"
          onClick={() => setOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="modal bg-white p-6 md:p-8 rounded-lg shadow-xl w-[90vw] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">{book.title}</h3>
            <p className="text-slate-700 mb-6">
              {!session
                ? "購入するにはログインが必要です。ボタンを押すとログインします。"
                : purchased
                ? "この本は購入済みです。今すぐ読むことができます。"
                : canBuy
                ? "この本を購入しますか？"
                : "この商品は現在購入できません（価格未設定）"}
            </p>

            <div className="flex justify-end gap-3">
              <button
                ref={closeBtnRef}
                className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </button>

              <button
                className={`text-white font-semibold py-2 px-4 rounded ${
                  purchased
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : !canBuy || status === "loading" || buying
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={handlePrimary}
                disabled={
                  !purchased && (!canBuy || status === "loading" || buying)
                }
                aria-disabled={
                  !purchased && (!canBuy || status === "loading" || buying)
                }
              >
                {purchased
                  ? "読む"
                  : buying
                  ? "処理中..."
                  : canBuy
                  ? "購入する"
                  : "販売準備中"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ---- ここまで ---- */}
    </>
  );
}
