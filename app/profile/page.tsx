import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import prisma from "@/app/lib/prisma";
import { nextAuthOptions as authOptions } from "@/app/lib/next-auth/option";
import { client } from "@/app/lib/microcms/client";

// microCMSのサムネ正規化（このページだけで使う簡易版）
function thumbUrlOf(b: any): string | null {
  const t = b?.thumbnail;
  if (!t) return null;
  if (typeof t === "string") return t.trim() || null;
  return t?.url?.trim() || null;
}

export default async function ProfilePage() {
  // ---- 認証チェック ----
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  const user = session.user;

  // ---- 購入履歴取得（自分の分だけ）----
  const purchases = await prisma.purchase.findMany({
    where: { userId: (user as any).id as string },
    orderBy: { createdAt: "desc" },
  });

  // ---- microCMSから本の詳細を併せて取得 ----
  // 失敗してもページは落とさずに「（削除/非公開）」で表示
  const items = await Promise.all(
    purchases.map(async (p) => {
      try {
        const book = await client.getListDetail({
          endpoint: "ebook",
          contentId: p.bookId,
        });
        return {
          id: p.bookId,
          title: book?.title ?? "(タイトル未設定)",
          description: book?.description ?? "",
          imageUrl: thumbUrlOf(book),
          createdAt: p.createdAt,
        };
      } catch {
        return {
          id: p.bookId,
          title: "（削除/非公開の可能性）",
          description: "",
          imageUrl: null as string | null,
          createdAt: p.createdAt,
        };
      }
    })
  );

  return (
    <div className="container mx-auto px-4 py-10">
      {/* プロフィールカード */}
      <div className="mx-auto max-w-xl rounded-2xl bg-white shadow p-8">
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            {/* next-auth の user.image があれば表示 */}
            {user?.image ? (
              <Image
                src={user.image}
                alt="avatar"
                width={96}
                height={96}
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-slate-400">
                <span className="text-sm">no image</span>
              </div>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold">{user?.name ?? "User"}</h1>
          <p className="text-slate-600">{user?.email}</p>
        </div>
      </div>

      {/* 購入履歴 */}
      <div className="mx-auto mt-10 max-w-5xl">
        <h2 className="mb-4 text-xl font-semibold">購入履歴</h2>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-slate-500">
            まだ購入履歴がありません。
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:gap-6">
            {items.map((it) => (
              <li
                key={`${it.id}-${it.createdAt.toISOString()}`}
                className="rounded-xl border bg-white p-4 md:p-5 shadow-sm hover:shadow transition"
              >
                <div className="flex gap-4">
                  {/* サムネイル */}
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                    {it.imageUrl ? (
                      <Image
                        src={it.imageUrl}
                        alt={it.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-slate-400 text-xs">
                        no image
                      </div>
                    )}
                  </div>

                  {/* テキスト */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="truncate text-lg font-medium">
                        {it.title}
                      </h3>
                      <span className="whitespace-nowrap text-xs text-slate-500">
                        {new Date(it.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {it.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {it.description}
                      </p>
                    )}

                    <div className="mt-3">
                      <Link
                        href={`/book/${it.id}`}
                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        読む
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
