import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { chatJSON } from "@/lib/ai/deepseek";
import { db } from "@/lib/db/client";
import { mealPlans, bodyProfiles } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

const ANALYZE_PROMPT = `你是一位专业的营养师。请根据用户一周的实际饮食记录，做出简洁实用的分析。

分析维度：
1. 总体评分（1-10分）
2. 做得好的方面（2-3点，要具体到菜品）
3. 需要改进的方面（2-3点，给出具体建议，例如"周三午餐碳水偏高，可用糙米替换白米"）
4. 营养均衡度：蛋白质、脂肪、碳水的比例是否合理
5. 一句话总结

请严格按以下 JSON 格式返回：
{
  "score": 数字1-10,
  "highlights": ["做得好的点1", "做得好的点2"],
  "improvements": ["需改进的点1", "需改进的点2"],
  "macroBalance": "蛋白质/脂肪/碳水比例评价，一句话",
  "summary": "一句话总结"
}`;

interface AnalysisResult {
  score: number;
  highlights: string[];
  improvements: string[];
  macroBalance: string;
  summary: string;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = (await req.json()) as { planId: string };
  if (!planId) return NextResponse.json({ error: "planId is required" }, { status: 400 });

  const [plan] = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.id, planId));

  if (!plan || plan.userId !== userId) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Get body profile for context
  const [body] = await db
    .select()
    .from(bodyProfiles)
    .where(eq(bodyProfiles.userId, userId));

  // Build a readable meal summary
  const planData = plan.plan as unknown as Record<string, Record<string, { title: string; calories: number; protein?: number; fat?: number; carbs?: number; portion?: string }>>;
  const dayLabels: Record<string, string> = {
    mon: "周一", tue: "周二", wed: "周三", thu: "周四",
    fri: "周五", sat: "周六", sun: "周日",
  };

  const lines: string[] = [];
  if (body) {
    lines.push(`用户信息：身高${body.height}cm，体重${body.weight}kg，目标${body.goal === "cut" ? "减脂" : body.goal === "bulk" ? "增肌" : "维持"}，每日目标${body.targetCalories ?? plan.targetCalories}kcal`);
  } else {
    lines.push(`每日目标热量：${plan.targetCalories}kcal`);
  }

  for (const [day, meals] of Object.entries(planData)) {
    const label = dayLabels[day] ?? day;
    for (const [mealType, meal] of Object.entries(meals)) {
      if (meal && typeof meal === "object" && meal.title) {
        const mealLabel = mealType === "breakfast" ? "早餐" : mealType === "lunch" ? "午餐" : "晚餐";
        lines.push(`${label}${mealLabel}：${meal.title}（${meal.calories}kcal，P${meal.protein ?? "?"}g F${meal.fat ?? "?"}g C${meal.carbs ?? "?"}g）${meal.portion ? ` - ${meal.portion}` : ""}`);
      }
    }
  }

  try {
    const result = await chatJSON<AnalysisResult>(
      [
        { role: "system", content: ANALYZE_PROMPT },
        { role: "user", content: `以下是我这周（${plan.weekStart}）的饮食记录：\n\n${lines.join("\n")}` },
      ],
      { maxTokens: 4096 },
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error("Diet analysis failed:", e);
    return NextResponse.json({ error: "分析失败，请稍后重试" }, { status: 500 });
  }
}
