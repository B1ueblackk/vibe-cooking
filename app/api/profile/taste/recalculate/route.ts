import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, tasteProfiles, recipes, favorites, restaurants } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";
import { chatJSON } from "@/lib/ai/deepseek";
import { TASTE_ANALYSIS_PROMPT } from "@/lib/ai/prompts";

interface TasteResult {
  spicy: number;
  sweet: number;
  savory: number;
  sour: number;
  preferredCuisines: string[];
}

export async function POST() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check dirty flag
  const [user] = await db.select({ tasteDirty: users.tasteDirty }).from(users).where(eq(users.id, userId));
  if (!user || user.tasteDirty !== 1) {
    return NextResponse.json({ skipped: true, reason: "not dirty" });
  }

  // Gather user data
  const userRecipes = await db
    .select({ title: recipes.title, description: recipes.description, ingredients: recipes.ingredients })
    .from(recipes)
    .where(eq(recipes.authorId, userId))
    .limit(50);

  const favRows = await db
    .select({ title: recipes.title, description: recipes.description })
    .from(favorites)
    .innerJoin(recipes, eq(favorites.recipeId, recipes.id))
    .where(eq(favorites.userId, userId))
    .limit(50);

  const userRestaurants = await db
    .select({ name: restaurants.name, tags: restaurants.tags, signatureDishes: restaurants.signatureDishes })
    .from(restaurants)
    .where(eq(restaurants.userId, userId))
    .limit(50);

  // Build context for AI
  const context = [
    userRecipes.length > 0 ? `用户创建的菜谱：${userRecipes.map((r) => `${r.title}（${r.description}）`).join("；")}` : "",
    favRows.length > 0 ? `用户收藏的菜谱：${favRows.map((r) => `${r.title}（${r.description}）`).join("；")}` : "",
    userRestaurants.length > 0 ? `用户去过的餐厅：${userRestaurants.map((r) => `${r.name}（${JSON.stringify(r.tags)}）`).join("；")}` : "",
  ].filter(Boolean).join("\n");

  if (!context) {
    return NextResponse.json({ skipped: true, reason: "no data" });
  }

  let result: TasteResult;
  try {
    result = await chatJSON<TasteResult>([
      { role: "system", content: TASTE_ANALYSIS_PROMPT },
      { role: "user", content: context },
    ], { temperature: 0.3 });
  } catch (e) {
    console.error("[TasteRecalculate] AI call failed:", e);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
  }

  // Upsert taste profile
  const now = new Date().toISOString();
  const [existing] = await db.select().from(tasteProfiles).where(eq(tasteProfiles.userId, userId));

  if (existing) {
    await db.update(tasteProfiles).set({
      spicy: result.spicy,
      sweet: result.sweet,
      savory: result.savory,
      sour: result.sour,
      preferredCuisines: result.preferredCuisines,
      updatedAt: now,
    }).where(eq(tasteProfiles.userId, userId));
  } else {
    await db.insert(tasteProfiles).values({
      userId,
      spicy: result.spicy,
      sweet: result.sweet,
      savory: result.savory,
      sour: result.sour,
      preferredCuisines: result.preferredCuisines,
      updatedAt: now,
    });
  }

  // Clear dirty flag
  await db.update(users).set({ tasteDirty: 0 }).where(eq(users.id, userId));

  return NextResponse.json({ ...result, updatedAt: now });
}
