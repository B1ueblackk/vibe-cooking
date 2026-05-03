import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, recipes, favorites, restaurants, tasteProfiles, userPreferredTags } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [recipeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(recipes)
    .where(eq(recipes.authorId, userId));

  const [favoriteCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(favorites)
    .where(eq(favorites.userId, userId));

  const [restaurantCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(restaurants);

  // Fetch user preferred tags
  const prefTags = await db
    .select()
    .from(userPreferredTags)
    .where(eq(userPreferredTags.userId, userId));

  return NextResponse.json({
    user,
    stats: {
      recipeCount: recipeCount?.count ?? 0,
      favoriteCount: favoriteCount?.count ?? 0,
      restaurantCount: restaurantCount?.count ?? 0,
    },
    preferredTags: prefTags.map((t) => ({ name: t.tagName, type: t.tagType })),
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { nickname, avatarUrl, preferredTags } = body as {
    nickname?: string;
    avatarUrl?: string;
    preferredTags?: { name: string; type: string }[];
  };

  // Update user fields
  const userUpdates: Record<string, unknown> = {};
  if (nickname?.trim()) userUpdates.nickname = nickname.trim();
  if (avatarUrl !== undefined) userUpdates.avatarUrl = avatarUrl;

  if (Object.keys(userUpdates).length > 0) {
    await db.update(users).set(userUpdates).where(eq(users.id, userId));
  }

  // Update preferred tags
  if (preferredTags !== undefined) {
    // Delete all existing tags for user
    await db.delete(userPreferredTags).where(eq(userPreferredTags.userId, userId));

    // Insert new tags
    if (preferredTags.length > 0) {
      await db.insert(userPreferredTags).values(
        preferredTags.map((t) => ({
          userId,
          tagName: t.name,
          tagType: t.type,
        })),
      );
    }

    // Also update tasteProfiles.preferredCuisines with cuisine tags
    const cuisineTags = preferredTags
      .filter((t) => t.type === "cuisine")
      .map((t) => t.name);

    await db
      .update(tasteProfiles)
      .set({
        preferredCuisines: cuisineTags,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasteProfiles.userId, userId));
  }

  return NextResponse.json({ success: true });
}
