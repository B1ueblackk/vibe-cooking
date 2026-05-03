import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communityPosts, likes } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, id)))
    .limit(1);

  if (existing) {
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, id)));
    await db
      .update(communityPosts)
      .set({ likesCount: sql`${communityPosts.likesCount} - 1` })
      .where(eq(communityPosts.id, id));
  } else {
    await db.insert(likes).values({ userId, postId: id });
    await db
      .update(communityPosts)
      .set({ likesCount: sql`${communityPosts.likesCount} + 1` })
      .where(eq(communityPosts.id, id));
  }

  const [updated] = await db
    .select({ likesCount: communityPosts.likesCount })
    .from(communityPosts)
    .where(eq(communityPosts.id, id));

  return NextResponse.json({
    liked: !existing,
    likesCount: updated?.likesCount ?? 0,
  });
}
