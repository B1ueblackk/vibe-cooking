import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { restaurants } from "@/lib/db/schema";
import type { Tag } from "@/lib/types";

// GET /api/restaurants/[id]
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(restaurants).where(eq(restaurants.id, id));
  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

// PUT /api/restaurants/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const tags: Tag[] = [
    ...cuisines.map((c, i) => ({ id: `gen-c-${c}`, name: c, type: "cuisine" as const, sortOrder: i })),
    ...tastes.map((t, i) => ({ id: `gen-t-${t}`, name: t, type: "taste" as const, sortOrder: i })),
  ];

  const result = await db.update(restaurants).set({
    name: name?.trim(),
    address: address?.trim(),
    longitude: lng,
    latitude: lat,
    tags,
    costAvg: costAvg ?? null,
    rating: rating ?? null,
    signatureDishes: signatureDishes ?? [],
    notes: notes?.trim() || null,
    status: status ?? "visited",
  }).where(eq(restaurants.id, id)).returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(result[0]);
}

// DELETE /api/restaurants/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await db.delete(restaurants).where(eq(restaurants.id, id)).returning();
  if (result.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
