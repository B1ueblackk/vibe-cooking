import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { mealPlans } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// GET /api/mealplan/history — all saved weekly plans for current user
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.userId, userId))
    .orderBy(desc(mealPlans.createdAt));

  return NextResponse.json(rows);
}
