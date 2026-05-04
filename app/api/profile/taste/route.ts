import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tasteProfiles, users } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db
    .select()
    .from(tasteProfiles)
    .where(eq(tasteProfiles.userId, userId));

  // Check if taste data is dirty
  const [user] = await db.select({ tasteDirty: users.tasteDirty }).from(users).where(eq(users.id, userId));
  const isDirty = (user?.tasteDirty ?? 1) === 1;

  return NextResponse.json(profile ? { ...profile, isDirty } : { isDirty });
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { spicy, sweet, savory, sour, preferredCuisines } = body as {
    spicy?: number;
    sweet?: number;
    savory?: number;
    sour?: number;
    preferredCuisines?: string[];
  };

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (spicy !== undefined) updates.spicy = spicy;
  if (sweet !== undefined) updates.sweet = sweet;
  if (savory !== undefined) updates.savory = savory;
  if (sour !== undefined) updates.sour = sour;
  if (preferredCuisines !== undefined) updates.preferredCuisines = preferredCuisines;

  const [updated] = await db
    .update(tasteProfiles)
    .set(updates)
    .where(eq(tasteProfiles.userId, userId))
    .returning();

  return NextResponse.json(updated);
}
