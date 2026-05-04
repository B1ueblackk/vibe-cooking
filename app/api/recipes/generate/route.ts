import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { chatJSON } from "@/lib/ai/deepseek";
import { RECIPE_GENERATION_PROMPT } from "@/lib/ai/prompts";
import { db } from "@/lib/db/client";
import { recipes } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

interface GeneratedRecipe {
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
  tags?: string[];
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { ingredients } = body as { ingredients: string[] };

  if (!ingredients?.length) {
    return NextResponse.json(
      { error: "请至少输入一种食材" },
      { status: 400 }
    );
  }

  // Insert a placeholder recipe with status "generating"
  const [saved] = await db.insert(recipes).values({
    authorId: userId,
    title: "AI 生成中...",
    description: "",
    isAiGenerated: true,
    sourceIngredients: ingredients,
    status: "generating",
  }).returning();

  const recipeId = saved.id;

  // Fire-and-forget: generate in background
  chatJSON<GeneratedRecipe>([
    { role: "system", content: RECIPE_GENERATION_PROMPT },
    {
      role: "user",
      content: `我手头有这些食材：${ingredients.join("、")}。请给我推荐一道菜。`,
    },
  ])
    .then(async (recipe) => {
      // Detect fallback (non-food input guardrail)
      if (recipe.title === "无法生成菜谱" || recipe.calories === 0) {
        await db.update(recipes).set({
          title: recipe.title,
          description: recipe.description || "请输入有效的食材，我来为您推荐菜谱",
          status: "fallback",
        }).where(eq(recipes.id, recipeId));
        console.log(`Recipe ${recipeId} marked as fallback (non-food input)`);
        return;
      }

      await db.update(recipes).set({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        calories: recipe.calories,
        protein: recipe.protein,
        fat: recipe.fat,
        carbs: recipe.carbs,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
        status: "done",
      }).where(eq(recipes.id, recipeId));
      console.log(`Recipe ${recipeId} generated successfully`);
    })
    .catch(async (err) => {
      console.error(`Recipe ${recipeId} generation failed:`, err);
      await db.update(recipes).set({
        status: "failed",
      }).where(eq(recipes.id, recipeId));
    });

  // Return immediately
  return NextResponse.json({ id: recipeId, status: "generating" });
}
