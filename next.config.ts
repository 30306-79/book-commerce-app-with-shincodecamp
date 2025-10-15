// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**", // 例: /u/* でもOK
      },
      {
        protocol: "https",
        hostname: "images.microcms-assets.io",
        pathname: "/**",
      },
    ],
    // 旧来の書き方でも可:
    // domains: ["avatars.githubusercontent.com"],
  },
};

export default nextConfig;
