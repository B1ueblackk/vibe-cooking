import { NextRequest, NextResponse } from "next/server";
import { eq, or, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { friendships, users, restaurants } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

// GET /api/friends — list accepted friends
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.userId, userId), eq(friendships.friendId, userId))
      )
    );

  // Get friend user info
  const friendIds = rows.map((r) => (r.userId === userId ? r.friendId : r.userId));
  if (friendIds.length === 0) return NextResponse.json([]);

  const allUsers = await db.select().from(users);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  // Get restaurant counts per friend
  const allRestaurants = await db.select().from(restaurants);
  const restaurantStats = new Map<string, { total: number; visited: number; want: number }>();
  for (const r of allRestaurants) {
    if (!r.userId || !friendIds.includes(r.userId)) continue;
    const stats = restaurantStats.get(r.userId) ?? { total: 0, visited: 0, want: 0 };
    stats.total++;
    if (r.status === "visited") stats.visited++;
    else stats.want++;
    restaurantStats.set(r.userId, stats);
  }

  const friends = rows.map((r) => {
    const fid = r.userId === userId ? r.friendId : r.userId;
    const u = userMap.get(fid);
    const stats = restaurantStats.get(fid);
    return {
      id: fid,
      nickname: u?.nickname ?? "未知用户",
      avatarUrl: u?.avatarUrl,
      friendshipId: r.id,
      starred: r.starred === 1,
      restaurantCount: stats?.total ?? 0,
      visitedCount: stats?.visited ?? 0,
      wantCount: stats?.want ?? 0,
    };
  });

  return NextResponse.json(friends);
}

// POST /api/friends — send friend request by phone
export async function POST(req: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { phone, inviteCode } = body as { phone?: string; inviteCode?: string };

  let targetUserId: string | null = null;

  if (inviteCode) {
    // Invite code is just the user ID encoded in base64
    try {
      targetUserId = atob(inviteCode);
    } catch {
      return NextResponse.json({ error: "无效的邀请码" }, { status: 400 });
    }
  } else if (phone) {
    // Find user by phone
    const [target] = await db.select().from(users).where(eq(users.phone, phone));
    if (!target) {
      return NextResponse.json({ error: "未找到该用户" }, { status: 404 });
    }
    targetUserId = target.id;
  } else {
    return NextResponse.json({ error: "请提供手机号或邀请码" }, { status: 400 });
  }

  if (targetUserId === userId) {
    return NextResponse.json({ error: "不能添加自己" }, { status: 400 });
  }

  // Verify target user exists
  const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));
  if (!targetUser) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // Check existing friendship (in either direction)
  const existing = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userId, userId), eq(friendships.friendId, targetUserId)),
        and(eq(friendships.userId, targetUserId), eq(friendships.friendId, userId))
      )
    );

  if (existing.length > 0) {
    const f = existing[0];
    if (f.status === "accepted") {
      return NextResponse.json({ error: "你们已经是好友了" }, { status: 400 });
    }
    if (f.status === "pending") {
      // If the other person sent us a request, auto-accept
      if (f.userId === targetUserId && f.friendId === userId) {
        await db.update(friendships).set({ status: "accepted" }).where(eq(friendships.id, f.id));
        return NextResponse.json({ status: "accepted", message: "已自动接受好友请求" });
      }
      return NextResponse.json({ error: "已发送过好友请求，等待对方接受" }, { status: 400 });
    }
    // If rejected, allow re-request by deleting old and creating new
    await db.delete(friendships).where(eq(friendships.id, f.id));
  }

  const [created] = await db.insert(friendships).values({
    userId,
    friendId: targetUserId,
    status: "pending",
  }).returning();

  return NextResponse.json({
    id: created.id,
    status: "pending",
    targetNickname: targetUser.nickname,
  });
}
