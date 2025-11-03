// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // GitHubアイコン用
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      // microCMS画像用
      {
        protocol: "https",
        hostname: "images.microcms-assets.io",
        pathname: "/**",
      },
      // ✅ Unsplash画像用（今回の追加）
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // ✅ Supabaseストレージ画像も今後使う可能性あり
      {
        protocol: "https",
        hostname: "qvxpxcgqfpvznedvewsh.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
