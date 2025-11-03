// app/lib/microcms/client.ts
import "server-only";
import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

// microCMSのレスポンス → 画面用に整形
const normalize = (c: any) => ({
  ...c,
  // 画像フィールドが string / { url } どちらでもOKにする
  thumbnailUrl:
    typeof c?.thumbnail === "string"
      ? c.thumbnail?.trim() || null
      : c?.thumbnail?.url?.trim() || null,
});

// 一覧取得（既存）
export const getAllBooks = async () => {
  const all = await client.getList({
    endpoint: "ebook",
    queries: { limit: 100 },
  });
  return { ...all, contents: (all.contents ?? []).map(normalize) };
};

// ✅ 追加：詳細1件取得
// 例: await getDetailVBook("olc8yytzpp7")
export const getDetailVBook = async (id: string) => {
  if (!id) throw new Error("getDetailVBook: id is required");

  const item = await client.getListDetail({
    endpoint: "ebook",
    contentId: id,
    // 必要なら取得フィールドを絞る
    // queries: { fields: ["id","title","thumbnail","body","publishedAt","revisedAt"] }
  });

  return normalize(item);
};
