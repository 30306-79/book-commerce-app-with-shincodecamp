export type BookType = {
  id: string; // ← microCMSは文字列ID
  title: string;
  price?: number | null; // 価格が未設定の場合に備えて optional
  thumbnailUrl: string | null; // ← 取得時に string|null に正規化する前提
  createdAt?: string;
  updatedAt?: string;
};
