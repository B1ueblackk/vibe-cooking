import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bodyProfiles } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  intense: 1.725,
};

const GOAL_LABELS: Record<string, string> = {
  bulk: "增肌", cut: "减脂", maintain: "维持体重",
};

function calculateNutrition(params: {
  height: number;
  weight: number;
  age: number;
  gender: "male" | "female";
  goal: "bulk" | "cut" | "maintain";
  activityLevel: string;
  cheatMeals: number;
}) {
  const { height, weight, age, gender, goal, activityLevel, cheatMeals } = params;

  // Mifflin-St Jeor BMR
  const bmr = gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  // TDEE
  const factor = ACTIVITY_FACTORS[activityLevel] ?? 1.375;
  const tdee = Math.round(bmr * factor);

  // Goal adjustment
  let targetCalories: number;
  if (goal === "cut") targetCalories = tdee - 400;
  else if (goal === "bulk") targetCalories = tdee + 250;
  else targetCalories = tdee;

  // Cheat meal adjustment: spread extra calories across non-cheat days
  if (cheatMeals > 0 && cheatMeals < 7) {
    const extraPerWeek = cheatMeals * 500;
    const dailyDeduction = Math.round(extraPerWeek / (7 - cheatMeals));
    targetCalories -= dailyDeduction;
  }

  targetCalories = Math.max(targetCalories, 1200); // safety floor

  // Protein: cut 2g/kg, bulk 1.8g/kg, maintain 1.5g/kg
  const proteinPerKg = goal === "cut" ? 2.0 : goal === "bulk" ? 1.8 : 1.5;
  const targetProtein = Math.round(weight * proteinPerKg);

  // Fat: 27.5% of calories
  const targetFat = Math.round((targetCalories * 0.275) / 9);

  // Carbs: remaining calories / 4
  const proteinCals = targetProtein * 4;
  const fatCals = targetFat * 9;
  const targetCarbs = Math.round((targetCalories - proteinCals - fatCals) / 4);

  // Generate summary
  const goalLabel = GOAL_LABELS[goal] ?? goal;
  let summary = `根据您的身体数据，建议每日摄入 ${targetCalories} kcal。`;
  if (goal === "cut") {
    summary += `减脂期蛋白质摄入建议 ${targetProtein}g/天（2g/kg），有助于保持肌肉量。`;
  } else if (goal === "bulk") {
    summary += `增肌期适度热量盈余，蛋白质 ${targetProtein}g/天支持肌肉合成。`;
  } else {
    summary += `维持期保持均衡饮食，蛋白质 ${targetProtein}g/天维持肌肉。`;
  }
  if (cheatMeals > 0) {
    summary += `每周 ${cheatMeals} 次放纵餐已计入，其余天数适当控制。`;
  }

  return { targetCalories, targetProtein, targetFat, targetCarbs, summary };
}

// GET /api/profile/body
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .select()
    .from(bodyProfiles)
    .where(eq(bodyProfiles.userId, userId));

  return NextResponse.json(row ?? null);
}

// POST /api/profile/body — calculate and save
export async function POST(req: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { height, weight, age, gender, goal, activityLevel, cheatMeals } = body as {
    height: number;
    weight: number;
    age: number;
    gender: "male" | "female";
    goal: "bulk" | "cut" | "maintain";
    activityLevel: "sedentary" | "light" | "moderate" | "intense";
    cheatMeals: number;
  };

  if (!height || !weight || !goal || !age || !gender || !activityLevel) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const result = calculateNutrition({ height, weight, age, gender, goal, activityLevel, cheatMeals: cheatMeals ?? 0 });

  const data = {
    userId,
    height,
    weight,
    age,
    gender,
    activityLevel,
    goal,
    cheatMeals: cheatMeals ?? 0,
    targetCalories: result.targetCalories,
    targetProtein: result.targetProtein,
    targetFat: result.targetFat,
    targetCarbs: result.targetCarbs,
    aiSummary: result.summary,
    updatedAt: new Date().toISOString(),
  };

  // Upsert
  const [existing] = await db
    .select()
    .from(bodyProfiles)
    .where(eq(bodyProfiles.userId, userId));

  if (existing) {
    await db.update(bodyProfiles).set(data).where(eq(bodyProfiles.userId, userId));
  } else {
    await db.insert(bodyProfiles).values(data);
  }

  return NextResponse.json(data);
}
