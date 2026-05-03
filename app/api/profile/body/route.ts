import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { chatJSON } from "@/lib/ai/deepseek";
import { BODY_ANALYSIS_PROMPT } from "@/lib/ai/prompts";
import { db } from "@/lib/db/client";
import { bodyProfiles } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

interface BodyAnalysisResponse {
  targetCalories: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
  summary: string;
}

const GOAL_LABELS: Record<string, string> = {
  bulk: "增肌", cut: "减脂", maintain: "维持体重",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "久坐", light: "轻度活动", moderate: "中等活动", intense: "高强度训练",
};

const GENDER_LABELS: Record<string, string> = {
  male: "男", female: "女",
};

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

// POST /api/profile/body — AI 分析并保存
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

  try {
    const userInfo = `性别 ${GENDER_LABELS[gender] ?? gender}，年龄 ${age}岁，身高 ${height}cm，体重 ${weight}kg，目标：${GOAL_LABELS[goal] ?? goal}，训练频率：${ACTIVITY_LABELS[activityLevel] ?? activityLevel}，每周 ${cheatMeals ?? 0} 次放纵餐`;

    const result = await chatJSON<BodyAnalysisResponse>(
      [
        { role: "system", content: BODY_ANALYSIS_PROMPT },
        { role: "user", content: userInfo },
      ],
      { maxTokens: 4096 }
    );

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
  } catch (e) {
    console.error("Body analysis failed:", e);
    return NextResponse.json({ error: "分析失败，请稍后重试" }, { status: 500 });
  }
}
