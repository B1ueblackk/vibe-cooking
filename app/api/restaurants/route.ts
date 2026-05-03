import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { restaurants } from "@/lib/db/schema";
import type { Tag } from "@/lib/types";
import { getAuthUser } from "@/lib/auth";

// GET /api/restaurants — list all restaurants for current user
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(restaurants);
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
    notes, status, cuisines, tastes,
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
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}
