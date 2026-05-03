import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, recipes, favorites, restaurants } from "@/lib/db/schema";
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

  return NextResponse.json({
    user,
    stats: {
      recipeCount: recipeCount?.count ?? 0,
      favoriteCount: favoriteCount?.count ?? 0,
      restaurantCount: restaurantCount?.count ?? 0,
    },
  });
}
