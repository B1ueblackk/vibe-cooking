import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communityPosts, favorites } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [post] = await db
    .select({ recipeId: communityPosts.recipeId })
    .from(communityPosts)
    .where(eq(communityPosts.id, id))
    .limit(1);

  if (!post?.recipeId) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const [existing] = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.recipeId, post.recipeId)))
    .limit(1);

  if (existing) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.recipeId, post.recipeId)));
  } else {
    await db.insert(favorites).values({ userId, recipeId: post.recipeId });
  }

  return NextResponse.json({ saved: !existing });
}
