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
    isOwner: row.recipe.authorId === userId,
  });
}

// PUT /api/recipes/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.authorId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "not found or forbidden" }, { status: 404 });
  }

  const body = await request.json();

  const result = await db
    .update(recipes)
    .set({
      title: body.title?.trim() ?? existing.title,
      description: body.description ?? existing.description,
      ingredients: body.ingredients ?? existing.ingredients,
      steps: body.steps ?? existing.steps,
      calories: body.calories ?? existing.calories,
      protein: body.protein ?? existing.protein,
      fat: body.fat ?? existing.fat,
      carbs: body.carbs ?? existing.carbs,
      cookTime: body.cookTime ?? existing.cookTime,
      difficulty: body.difficulty ?? existing.difficulty,
      coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
    })
    .where(eq(recipes.id, id))
    .returning();

  return NextResponse.json(result[0]);
}

// DELETE /api/recipes/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Only author can delete
  const result = await db
    .delete(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.authorId, userId)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "not found or forbidden" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
