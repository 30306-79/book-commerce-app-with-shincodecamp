import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter"; // v4想定
import prisma from "../prisma"; // ★ app/lib/prisma.ts を指す

const { GITHUB_ID, GITHUB_SECRET } = process.env;
if (!GITHUB_ID || !GITHUB_SECRET) {
  throw new Error("Missing GITHUB_ID or GITHUB_SECRET");
}

export const nextAuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: GITHUB_ID,
      clientSecret: GITHUB_SECRET,
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
};
