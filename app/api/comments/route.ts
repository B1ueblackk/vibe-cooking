import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { comments, users } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// GET /api/comments?type=recipe|post&id=xxx
export async function GET(req: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetType = req.nextUrl.searchParams.get("type");
  const targetId = req.nextUrl.searchParams.get("id");

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "type and id are required" }, { status: 400 });
  }

  const rows = await db
    .select({ comment: comments, author: users })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.targetType, targetType), eq(comments.targetId, targetId)))
    .orderBy(desc(comments.createdAt));

  const result = rows.map((r) => ({
    ...r.comment,
    author: r.author ? { id: r.author.id, nickname: r.author.nickname, avatarUrl: r.author.avatarUrl } : undefined,
  }));

  return NextResponse.json(result);
}

// POST /api/comments
export async function POST(request: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetType, targetId, content } = await request.json() as {
    targetType: string;
    targetId: string;
    content: string;
  };

  if (!targetType || !targetId || !content?.trim()) {
    return NextResponse.json({ error: "targetType, targetId, and content are required" }, { status: 400 });
  }

  if (!["post", "recipe"].includes(targetType)) {
    return NextResponse.json({ error: "invalid targetType" }, { status: 400 });
  }

  const [row] = await db.insert(comments).values({
    userId,
    targetType,
    targetId,
    content: content.trim(),
  }).returning();

  // Fetch author info
  const [author] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return NextResponse.json({
    ...row,
    author: author ? { id: author.id, nickname: author.nickname, avatarUrl: author.avatarUrl } : undefined,
  }, { status: 201 });
}
