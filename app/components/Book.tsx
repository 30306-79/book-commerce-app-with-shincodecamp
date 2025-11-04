// app/components/Book.tsx
"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import type { BookType } from "../types/types";

// ----------------- Skeleton -----------------
const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="m-4 w-[450px]">
      <div className="animate-pulse rounded-md overflow-hidden shadow">
        <div className="h-[350px] bg-slate-200" />
        <div className="bg-slate-100 p-4 space-y-3">
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
          <div className="h-4 w-2/3 bg-slate-200 rounded" />
          <div className="h-4 w-1/3 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
});

export default function Book({ book }: { book: BookType }) {
  const [open, setOpen] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [checking, setChecking] = useState(false); // 購入済みチェック中
  const [checkedOnce, setCheckedOnce] = useState(false); // 一度でも判定済みか
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  const src =
    book.thumbnailUrl && book.thumbnailUrl.trim() ? book.thumbnailUrl : null;

  const priceText =
    typeof book.price === "number" ? `¥${book.price.toLocaleString()}` : "—";

  const canBuy =
    typeof book.price === "number" &&
    Number.isFinite(book.price) &&
    book.price > 0;

  const checkPurchased = useCallback(async () => {
    try {
      setChecking(true);
      const res = await fetch(`/api/purchases/has?bookId=${book.id}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setPurchased(Boolean(data?.purchased));
      setCheckedOnce(true);
    } catch {
      setPurchased(false);
      setCheckedOnce(true);
    } finally {
      setChecking(false);
    }
  }, [book.id]);

  // セッション確定で判定
  useEffect(() => {
    if (!session?.user) {
      // 未ログインは「購入済みチェック不要」なので即確定扱いにする
      setPurchased(false);
      setCheckedOnce(true);
      setChecking(false);
      return;
    }
    // ログイン済みなら問い合わせ
    checkPurchased();
  }, [session?.user, checkPurchased]);

  const startCheckout = async () => {
    if (status === "unauthenticated") {
      await signIn("github");
      return;
    }

    const title = book.title;
    const price = Number(book.price);
    const bookId = book.id;

    if (!bookId || !title || !Number.isFinite(price) || price <= 0) {
      alert("購入情報が不足しています");
      return;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // userIdは送らない（サーバ側でセッションから取得）
      body: JSON.stringify({ title, price, bookId }),
    });

    if (res.status === 401) {
      await signIn("github");
      return;
    }
    if (res.status === 409) {
      // 既購入: モーダルだけ「読む」に切り替え
      setPurchased(true);
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Checkout error");
    if (data.url) window.location.href = data.url;
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

  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  const handlePrimary = async () => {
    if (status === "loading") return;

    if (!session) {
      await signIn("github");
      return;
    }

    if (purchased) {
      router.push(`/book/${book.id}`);
      setOpen(false);
      return;
    }

    if (!canBuy) {
      alert("この商品は現在購入できません（価格未設定）");
      return;
    }

    await startCheckout();
    if (!purchased) setOpen(false);
  };

  // ★ ここがポイント：
  // 1) 未ログイン → 判定不要なので即描画
  // 2) ログイン中 → 購入済みチェックが完了するまでカードは出さず Skeleton を返す
  const shouldShowSkeleton =
    status === "loading" || (session?.user && (!checkedOnce || checking));

  if (shouldShowSkeleton) {
    return <CardSkeleton />;
  }

  return (
    <>
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
        <div
          onClick={() => setOpen(true)}
          className="relative cursor-pointer shadow-2xl duration-300 hover:translate-y-1 hover:shadow-none rounded-md overflow-hidden"
          role="button"
          aria-label={`${book.title} を開く`}
        >
          {session?.user && purchased && (
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
              {session?.user && purchased && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  購入済み
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

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
                    : !canBuy || status === "loading"
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={handlePrimary}
                disabled={!purchased && (!canBuy || status === "loading")}
                aria-disabled={!purchased && (!canBuy || status === "loading")}
              >
                {purchased ? "読む" : canBuy ? "購入する" : "販売準備中"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
