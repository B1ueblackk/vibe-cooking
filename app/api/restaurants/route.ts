import { NextRequest, NextResponse } from "next/server";
import { eq, or, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { restaurants, friendships, users } from "@/lib/db/schema";
import type { Tag } from "@/lib/types";
import { getAuthUser } from "@/lib/auth";

// GET /api/restaurants — list restaurants, optionally including friends'
export async function GET(req: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendIdsParam = req.nextUrl.searchParams.get("friends");

  if (friendIdsParam) {
    const requestedIds = friendIdsParam.split(",").filter(Boolean);

    // Validate all requested friendIds have accepted friendship with current user
    const friendRows = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            and(eq(friendships.userId, userId), inArray(friendships.friendId, requestedIds)),
            and(eq(friendships.friendId, userId), inArray(friendships.userId, requestedIds))
          )
        )
      );

    const validIds = new Set(friendRows.map((f) => (f.userId === userId ? f.friendId : f.userId)));
    const queryIds = [userId, ...Array.from(validIds)];

    const rows = await db
      .select()
      .from(restaurants)
      .where(inArray(restaurants.userId, queryIds));

    // Add owner nickname
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const withOwner = rows.map((r) => ({
      ...r,
      ownerNickname: userMap.get(r.userId ?? "")?.nickname ?? "",
      isOwn: r.userId === userId,
    }));

    return NextResponse.json(withOwner);
  }

  // Default: only current user's restaurants
  const rows = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.userId, userId));

  return NextResponse.json(rows);
}

// POST /api/restaurants — create a new restaurant
export async function POST(request: Request) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const {
    name, address, lng, lat,
    costAvg, rating, signatureDishes,
    notes, status, cuisines, tastes, coverImage,
  } = body as {
    name: string;
    address: string;
    lng: number;
    lat: number;
    costAvg: number | null;
    rating: number | null;
    signatureDishes: string[];
    notes: string;
    status: string;
    cuisines: string[];
    tastes: string[];
    coverImage?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const tags: Tag[] = [
    ...cuisines.map((c, i) => ({ id: `gen-c-${c}`, name: c, type: "cuisine" as const, sortOrder: i })),
    ...tastes.map((t, i) => ({ id: `gen-t-${t}`, name: t, type: "taste" as const, sortOrder: i })),
  ];

  const result = await db.insert(restaurants).values({
    userId,
    name: name.trim(),
    address: address?.trim() ?? "",
    longitude: lng,
    latitude: lat,
    tags,
    costAvg: costAvg ?? undefined,
    rating: rating ?? undefined,
    signatureDishes: signatureDishes ?? [],
    notes: notes?.trim() || undefined,
    status: status ?? "visited",
    coverImage: coverImage || undefined,
  }).returning();

  // Mark taste as dirty
  await db.update(users).set({ tasteDirty: 1 }).where(eq(users.id, userId));

  return NextResponse.json(result[0], { status: 201 });
}
