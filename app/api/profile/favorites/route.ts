import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { favorites, recipes } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// GET /api/profile/favorites — list user's favorited recipes
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({ recipe: recipes })
    .from(favorites)
    .innerJoin(recipes, eq(favorites.recipeId, recipes.id))
    .where(eq(favorites.userId, userId));

  return NextResponse.json(rows.map((r) => r.recipe));
}
