import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recipes } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// GET /api/recipes — list user's saved recipes
// ?ai=1 to filter AI-generated only
export async function GET(req: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const aiOnly = req.nextUrl.searchParams.get("ai") === "1";

  const conditions = aiOnly
    ? and(eq(recipes.authorId, userId), eq(recipes.isAiGenerated, true))
    : eq(recipes.authorId, userId);

  const rows = await db
    .select()
    .from(recipes)
    .where(conditions)
    .orderBy(desc(recipes.createdAt));

  return NextResponse.json(rows);
}

// POST /api/recipes — save a recipe
export async function POST(request: Request) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const {
    title, description, ingredients, steps,
    calories, protein, fat, carbs,
    cookTime, difficulty, isAiGenerated, sourceIngredients,
  } = body as {
    title: string;
    description: string;
    ingredients: { name: string; amount: number; unit: string }[];
    steps: { order: number; text: string; timerSeconds?: number }[];
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    cookTime: number;
    difficulty: "easy" | "medium" | "hard";
    isAiGenerated?: boolean;
    sourceIngredients?: string[];
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const result = await db.insert(recipes).values({
    authorId: userId,
    title: title.trim(),
    description: description ?? "",
    ingredients: ingredients ?? [],
    steps: steps ?? [],
    calories: calories ?? 0,
    protein: protein ?? 0,
    fat: fat ?? 0,
    carbs: carbs ?? 0,
    cookTime: cookTime ?? 0,
    difficulty: difficulty ?? "easy",
    isAiGenerated: isAiGenerated ?? false,
    sourceIngredients: sourceIngredients ?? null,
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}
