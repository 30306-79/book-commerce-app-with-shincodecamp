// app/components/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const Header = () => {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="bg-slate-600 text-gray-100 shadow-lg">
      <nav className="flex items-center justify-between p-4 max-w-6xl mx-auto">
        {/* 左：サイトロゴ */}
        <Link href="/" className="text-xl font-bold">
          Book Commerce
        </Link>

        {/* 右：メニュー＆認証 */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            ホーム
          </Link>

          {/* ログイン中のみ「プロフィール」を表示（ホームとログアウトの間） */}
          {session && (
            <Link
              href="/profile"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              プロフィール
            </Link>
          )}

          {status === "loading" && (
            <span className="text-xs text-gray-200 px-2">認証確認中…</span>
          )}

          {/* 未ログイン時：ログインボタン＋ゲスト用アイコンを表示 */}
          {!session && status !== "loading" && (
            <>
              <button
                onClick={() => signIn()}
                className="text-gray-900 bg-white hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                ログイン
              </button>
              <Image
                width={36}
                height={36}
                alt="ゲスト（未ログイン）"
                src="/default_icon.png" // ← 復活：未ログイン時の表示画像
                className="rounded-full ring-1 ring-white/40 ml-1"
                priority
              />
            </>
          )}

          {/* ログイン時：ログアウト＋右端のプロフィール丸アイコン */}
          {session && (
            <>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="border border-white/40 hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium"
              >
                ログアウト
              </button>
              <Link href="/profile" className="ml-1">
                <Image
                  width={36}
                  height={36}
                  alt="プロフィール"
                  src={user?.image || "/default_icon.png"}
                  className="rounded-full ring-1 ring-white/40"
                  priority
                />
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
