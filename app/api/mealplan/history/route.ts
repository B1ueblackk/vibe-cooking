import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { mealPlans } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// GET /api/mealplan/history — all saved weekly plans for current user (one per week)
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.userId, userId))
    .orderBy(desc(mealPlans.createdAt));

  // Deduplicate: keep only the latest record per weekStart
  const seen = new Set<string>();
  const deduped = rows.filter((r) => {
    if (seen.has(r.weekStart)) return false;
    seen.add(r.weekStart);
    return true;
  });

  return NextResponse.json(deduped);
}
