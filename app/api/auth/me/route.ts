import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const userId = await getAuthUser();
  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: { id: user.id, nickname: user.nickname, phone: user.phone, avatarUrl: user.avatarUrl },
  });
}
