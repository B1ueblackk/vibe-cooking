import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communityPosts, users, recipes, likes, favorites } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") || "latest";
  const limit = searchParams.get("limit");

  const rows = await db
    .select({
      post: communityPosts,
      author: users,
      recipe: recipes,
      liked: likes,
      saved: favorites,
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.userId, users.id))
    .leftJoin(recipes, eq(communityPosts.recipeId, recipes.id))
    .leftJoin(
      likes,
      and(eq(likes.postId, communityPosts.id), eq(likes.userId, userId))
    )
    .leftJoin(
      favorites,
      and(eq(favorites.recipeId, communityPosts.recipeId), eq(favorites.userId, userId))
    )
    .orderBy(sort === "hot" ? desc(communityPosts.likesCount) : desc(communityPosts.createdAt))
    .limit(limit ? parseInt(limit, 10) : 50);

  const result = rows.map((row) => ({
    ...row.post,
    author: row.author ?? undefined,
    recipe: row.recipe ?? undefined,
    isLiked: row.liked !== null,
    isSaved: row.saved !== null,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { recipeId, caption = "" } = body as { recipeId?: string; caption?: string };

  if (!recipeId) {
    return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  }

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const [post] = await db
    .insert(communityPosts)
    .values({ userId, recipeId, caption })
    .returning();

  return NextResponse.json(post, { status: 201 });
}
