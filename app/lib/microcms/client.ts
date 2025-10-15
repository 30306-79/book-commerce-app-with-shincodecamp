// app/lib/microcms/client.ts
import "server-only";
import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

const normalize = (c: any) => ({
  ...c,
  thumbnailUrl:
    typeof c.thumbnail === "string"
      ? c.thumbnail?.trim() || null
      : c.thumbnail?.url?.trim() || null,
});

export const getAllBooks = async () => {
  const all = await client.getList({
    endpoint: "ebook",
    queries: { limit: 100 },
  });
  return { ...all, contents: (all.contents ?? []).map(normalize) };
};
