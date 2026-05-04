import { NextRequest, NextResponse } from "next/server";
import { eq, desc, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recommendations, users, recipes } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// GET /api/recipes/recommendations — get my inbox
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      rec: recommendations,
      sender: users,
      recipe: recipes,
    })
    .from(recommendations)
    .leftJoin(users, eq(recommendations.senderId, users.id))
    .leftJoin(recipes, eq(recommendations.recipeId, recipes.id))
    .where(eq(recommendations.receiverId, userId))
    .orderBy(desc(recommendations.createdAt))
    .limit(50);

  const result = rows.map((r) => ({
    ...r.rec,
    sender: r.sender ? { id: r.sender.id, nickname: r.sender.nickname, avatarUrl: r.sender.avatarUrl } : undefined,
    recipe: r.recipe ?? undefined,
  }));

  // Count unread
  const unreadCount = result.filter((r) => !r.readAt).length;

  return NextResponse.json({ items: result, unreadCount });
}

// POST /api/recipes/recommendations — mark as read
export async function POST(request: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db
    .update(recommendations)
    .set({ readAt: new Date().toISOString() })
    .where(eq(recommendations.id, id));

  return NextResponse.json({ ok: true });
}
