import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/ai/deepseek";
import { RECIPE_GENERATION_PROMPT } from "@/lib/ai/prompts";

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
  try {
    const body = await req.json();
    const { ingredients } = body as { ingredients: string[] };

    if (!ingredients?.length) {
      return NextResponse.json(
        { error: "请至少输入一种食材" },
        { status: 400 }
      );
    }

    const recipe = await chatJSON<GeneratedRecipe>([
      { role: "system", content: RECIPE_GENERATION_PROMPT },
      {
        role: "user",
        content: `我手头有这些食材：${ingredients.join("、")}。请给我推荐一道菜。`,
      },
    ]);

    return NextResponse.json({ recipe });
  } catch (e) {
    console.error("Recipe generation failed:", e);
    return NextResponse.json(
      { error: "菜谱生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
