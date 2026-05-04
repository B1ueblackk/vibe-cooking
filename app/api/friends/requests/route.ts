import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { friendships, users } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// GET /api/friends/requests — pending requests where I'm the receiver
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.friendId, userId),
        eq(friendships.status, "pending")
      )
    );

  if (rows.length === 0) return NextResponse.json([]);

  // Get sender info
  const allUsers = await db.select().from(users);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const requests = rows.map((r) => {
    const sender = userMap.get(r.userId);
    return {
      friendshipId: r.id,
      senderId: r.userId,
      nickname: sender?.nickname ?? "未知用户",
      avatarUrl: sender?.avatarUrl,
      createdAt: r.createdAt,
    };
  });

  return NextResponse.json(requests);
}
