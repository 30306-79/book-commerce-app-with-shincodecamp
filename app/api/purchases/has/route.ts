import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions as authOptions } from "@/app/lib/next-auth/option";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ purchased: false }, { status: 200 });
  }

  const found = await prisma.purchase.findUnique({
    where: { userId_bookId: { userId, bookId } },
    select: { id: true },
  });

  return NextResponse.json({ purchased: !!found });
}
