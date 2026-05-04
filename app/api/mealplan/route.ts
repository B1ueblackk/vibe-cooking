import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { chatJSON } from "@/lib/ai/deepseek";
import { MEAL_PLAN_PROMPT } from "@/lib/ai/prompts";
import { db } from "@/lib/db/client";
import { mealPlans, bodyProfiles, tasteProfiles } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

interface MealItem {
  title: string;
  calories: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  portion?: string;
}

interface DayPlan {
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
}

interface MealPlanResponse {
  plan: Record<string, DayPlan>;
  cheatDays?: number[];
  dailyAverage: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

// GET /api/mealplan — load the most recent saved plan
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.userId, userId))
    .orderBy(desc(mealPlans.createdAt))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json(null);
  }

  const row = rows[0];
  return NextResponse.json({
    ...row,
    status: row.status ?? "done",
  });
}

// POST /api/mealplan — create a pending record, generate in background
export async function POST(req: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { targetCalories: reqCalories } = body as { targetCalories?: number };

  // Read user's body profile and taste profile for richer context
  const [bodyRow] = await db
    .select()
    .from(bodyProfiles)
    .where(eq(bodyProfiles.userId, userId));

  const [tasteRow] = await db
    .select()
    .from(tasteProfiles)
    .where(eq(tasteProfiles.userId, userId));

  const calories = reqCalories ?? bodyRow?.targetCalories ?? 1800;

  const parts: string[] = [`目标每日热量：${calories} kcal`];

  if (bodyRow) {
    parts.push(`身体数据：身高 ${bodyRow.height}cm，体重 ${bodyRow.weight}kg`);
    parts.push(`健身目标：${bodyRow.goal === "cut" ? "减脂" : bodyRow.goal === "bulk" ? "增肌" : "维持体重"}`);
    if (bodyRow.targetProtein) parts.push(`建议蛋白质：${bodyRow.targetProtein}g/天`);
    if (bodyRow.targetFat) parts.push(`建议脂肪：${bodyRow.targetFat}g/天`);
    if (bodyRow.targetCarbs) parts.push(`建议碳水：${bodyRow.targetCarbs}g/天`);
    if (bodyRow.cheatMeals > 0) parts.push(`每周 ${bodyRow.cheatMeals} 次放纵餐，可适当放宽热量`);
  }

  if (tasteRow) {
    const spicy = tasteRow.spicy ?? 50;
    const spicyLabel = spicy > 80 ? "喜辣，可多安排辣味菜" : spicy > 60 ? "能吃辣，偶尔安排辣味菜" : spicy > 30 ? "口味适中，少量辣味即可" : "不吃辣，避免辣味菜";
    parts.push(`辣度：${spicyLabel}`);
    const cuisines = tasteRow.preferredCuisines;
    if (cuisines && cuisines.length > 0) {
      parts.push(`偏好菜系：${cuisines.join("、")}`);
    }
  }

  const preferences = parts.join("；");

  // Calculate week start (Monday of current week)
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const weekStart = monday.toISOString().split("T")[0];

  // Upsert: reuse existing record for this week, or create new
  const existing = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.userId, userId))
    .orderBy(desc(mealPlans.createdAt));

  const sameWeek = existing.find((r) => r.weekStart === weekStart);

  let planId: string;
  if (sameWeek) {
    // Update existing record for this week
    await db.update(mealPlans).set({
      targetCalories: calories,
      cheatDays: [],
      status: "generating",
      plan: {} as import("@/lib/types").WeekPlan,
    }).where(eq(mealPlans.id, sameWeek.id));
    planId = sameWeek.id;
  } else {
    const [saved] = await db.insert(mealPlans).values({
      userId,
      weekStart,
      plan: {} as import("@/lib/types").WeekPlan,
      targetCalories: calories,
      cheatDays: [],
      status: "generating",
    }).returning();
    planId = saved.id;
  }

  // Fire-and-forget: generate in background
  chatJSON<MealPlanResponse>(
    [
      { role: "system", content: MEAL_PLAN_PROMPT },
      { role: "user", content: `请根据以下偏好生成一周食谱：${preferences}` },
    ],
    { maxTokens: 32768 }
  )
    .then(async (result) => {
      await db.update(mealPlans).set({
        plan: result.plan as unknown as import("@/lib/types").WeekPlan,
        cheatDays: result.cheatDays ?? [],
        status: "done",
      }).where(eq(mealPlans.id, planId));
      console.log(`Meal plan ${planId} generated successfully`);
    })
    .catch(async (err) => {
      console.error(`Meal plan ${planId} generation failed:`, err);
      await db.update(mealPlans).set({
        status: "failed",
      }).where(eq(mealPlans.id, planId));
    });

  // Return immediately
  return NextResponse.json({
    id: planId,
    status: "generating",
    weekStart,
    targetCalories: calories,
  });
}

// PATCH /api/mealplan — replace a single meal slot in the latest plan
export async function PATCH(req: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { day, mealType, meal } = (await req.json()) as {
      day: string;
      mealType: "breakfast" | "lunch" | "dinner";
      meal: MealItem;
    };

    if (!day || !mealType || !meal) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId))
      .orderBy(desc(mealPlans.createdAt))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "暂无食谱计划" }, { status: 404 });
    }

    const existing = rows[0];
    const plan = existing.plan as unknown as Record<string, DayPlan>;

    if (!plan[day]) {
      return NextResponse.json({ error: "无效的日期" }, { status: 400 });
    }

    plan[day][mealType] = meal;

    await db
      .update(mealPlans)
      .set({ plan: plan as unknown as import("@/lib/types").WeekPlan })
      .where(eq(mealPlans.id, existing.id));

    return NextResponse.json({ plan });
  } catch (e) {
    console.error("Meal plan patch failed:", e);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
