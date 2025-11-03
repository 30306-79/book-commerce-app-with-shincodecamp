// app/book/[id]/page.tsx
import Image from "next/image";
import { getDetailVBook } from "@/app/lib/microcms/client"; // ← 既に作成済みの詳細取得関数
import type { Metadata } from "next";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await getDetailVBook(params.id).catch(() => null);
  return { title: book?.title ?? "Book Detail" };
}

function fmt(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(+dt)) return d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(dt.getDate()).padStart(2, "0")}`;
}

export default async function DetailBook({ params }: Props) {
  const book = await getDetailVBook(params.id);

  // microCMS のフィールド名はプロジェクトにより異なるので、必要に応じてここを合わせてください
  const title = book.title;
  const html = book.content; // リッチエディタHTML
  const imageUrl = book.thumbnailUrl ?? book.imageUrl ?? "/noimage.png";
  const publishedAt = book.publishedAt ?? book.createdAt;
  const updatedAt = book.updatedAt ?? book.revisedAt ?? book.publishedAt;

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-10">
      <article className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
        {/* 上：横長バナー（画像） */}
        <div className="relative h-[220px] sm:h-[260px] md:h-[300px] w-full">
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        </div>

        {/* 下：本文ブロック */}
        <div className="px-5 sm:px-7 md:px-10 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-5">
            {title}
          </h1>

          {/* 本文（typographyで読みやすく） */}
          <div
            className="prose prose-neutral prose-lg max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* 公開日・更新日 */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-500">
            <span>公開日: {fmt(publishedAt)}</span>
            <span>最終更新: {fmt(updatedAt)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
