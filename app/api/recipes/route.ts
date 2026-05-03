import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recipes, tags, recipeTags } from "@/lib/db/schema";
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
    tags: tagNames,
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
    tags?: string[];
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

  // Save tags if provided (from AI generation)
  if (tagNames?.length && result[0]) {
    await saveRecipeTags(result[0].id, tagNames).catch((e) =>
      console.error("[Tags] save failed:", e),
    );
  }

  return NextResponse.json(result[0], { status: 201 });
}

// Tag type inference from known catalogs
const CUISINE_TAGS = new Set([
  "川菜", "粤菜", "湘菜", "浙菜", "鲁菜", "苏菜", "闽菜", "徽菜",
  "东北菜", "西北菜", "江浙菜", "云南菜",
  "日料", "韩餐", "意餐", "法餐", "东南亚", "西餐",
  "火锅", "烧烤", "甜品", "小吃", "轻食",
]);
const TASTE_TAGS = new Set(["辣", "清淡", "甜", "咸鲜", "酸", "麻", "鲜香"]);
const SCENE_TAGS = new Set(["快手菜", "减脂餐", "增肌食谱", "家宴", "便当", "夜宵", "早餐", "下午茶"]);
const DIET_TAGS = new Set(["低卡", "高蛋白", "低碳水", "素食", "无麸质"]);

function inferTagType(name: string): string {
  if (CUISINE_TAGS.has(name)) return "cuisine";
  if (TASTE_TAGS.has(name)) return "taste";
  if (SCENE_TAGS.has(name)) return "scene";
  if (DIET_TAGS.has(name)) return "diet";
  return "dish";
}

async function saveRecipeTags(recipeId: string, tagNames: string[]) {
  for (const name of tagNames) {
    const type = inferTagType(name);
    // Upsert tag
    let [existing] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, name))
      .limit(1);

    if (!existing) {
      [existing] = await db
        .insert(tags)
        .values({ name, type, sortOrder: 0 })
        .returning();
    }

    // Insert recipe-tag link (ignore duplicates)
    await db
      .insert(recipeTags)
      .values({ recipeId, tagId: existing.id })
      .onConflictDoNothing();
  }
}
