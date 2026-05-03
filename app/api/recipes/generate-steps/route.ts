import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/ai/deepseek";
import { RECIPE_STEPS_PROMPT } from "@/lib/ai/prompts";

interface StepData {
  ingredients: { name: string; amount: number; unit: string }[];
  steps: { order: number; text: string; timerSeconds?: number }[];
  cookTime: number;
}

export async function POST(req: NextRequest) {
  try {
    const { title, portion } = (await req.json()) as {
      title: string;
      portion?: string;
    };

    if (!title) {
      return NextResponse.json({ error: "缺少菜名" }, { status: 400 });
    }

    const userMsg = portion
      ? `菜名：${title}，食材/份量参考：${portion}`
      : `菜名：${title}`;

    const result = await chatJSON<StepData>(
      [
        { role: "system", content: RECIPE_STEPS_PROMPT },
        { role: "user", content: userMsg },
      ],
      { maxTokens: 2048 }
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error("Generate steps failed:", e);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
