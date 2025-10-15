// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { nextAuthOptions } from "@/app/lib/next-auth/option";

const handler = NextAuth(nextAuthOptions);
export { handler as GET, handler as POST };
