import { NextRequest, NextResponse } from "next/server";
import { eq, and, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { friendships } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// PATCH /api/friends/[id] — accept/reject OR star/unstar
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as { status?: "accepted" | "rejected"; action?: "star" | "unstar" };

  // Handle star/unstar
  if (body.action === "star" || body.action === "unstar") {
    const [row] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.id, id),
          or(eq(friendships.userId, userId), eq(friendships.friendId, userId))
        )
      );

    if (!row) {
      return NextResponse.json({ error: "好友关系不存在" }, { status: 404 });
    }

    await db.update(friendships).set({ starred: body.action === "star" ? 1 : 0 }).where(eq(friendships.id, id));
    return NextResponse.json({ id, starred: body.action === "star" });
  }

  // Handle accept/reject
  const { status } = body;
  if (!status || !["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "无效状态" }, { status: 400 });
  }

  // Only the receiver can accept/reject
  const [row] = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.id, id), eq(friendships.friendId, userId)));

  if (!row) {
    return NextResponse.json({ error: "请求不存在" }, { status: 404 });
  }

  await db.update(friendships).set({ status }).where(eq(friendships.id, id));

  return NextResponse.json({ id, status });
}

// DELETE /api/friends/[id] — remove friendship
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Either party can remove
  const result = await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.id, id),
        or(eq(friendships.userId, userId), eq(friendships.friendId, userId))
      )
    )
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "好友关系不存在" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
