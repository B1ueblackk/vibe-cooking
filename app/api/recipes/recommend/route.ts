import { NextRequest, NextResponse } from "next/server";
import { eq, and, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recommendations, friendships, recipes } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipeId, friendId, message } = await request.json() as {
    recipeId: string;
    friendId: string;
    message?: string;
  };

  if (!recipeId || !friendId) {
    return NextResponse.json({ error: "recipeId and friendId are required" }, { status: 400 });
  }

  // Verify recipe exists
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  // Verify friendship is accepted
  const [friendship] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId)),
        ),
      ),
    )
    .limit(1);

  if (!friendship) {
    return NextResponse.json({ error: "Not friends" }, { status: 403 });
  }

  const [row] = await db.insert(recommendations).values({
    senderId: userId,
    receiverId: friendId,
    recipeId,
    message: message?.trim() || null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
