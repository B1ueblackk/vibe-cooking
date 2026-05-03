import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recipes, users, favorites } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// GET /api/recipes/[id]
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rows = await db
    .select({
      recipe: recipes,
      author: users,
      saved: favorites,
    })
    .from(recipes)
    .leftJoin(users, eq(recipes.authorId, users.id))
    .leftJoin(
      favorites,
      and(eq(favorites.recipeId, recipes.id), eq(favorites.userId, userId))
    )
    .where(eq(recipes.id, id));

  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const row = rows[0];
  return NextResponse.json({
    ...row.recipe,
    author: row.author ? { nickname: row.author.nickname, avatarUrl: row.author.avatarUrl } : undefined,
    isSaved: row.saved !== null,
  });
}

// DELETE /api/recipes/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await db.delete(recipes).where(eq(recipes.id, id)).returning();
  if (result.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
