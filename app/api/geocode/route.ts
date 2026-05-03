import { NextResponse } from "next/server";
import { geocode, parseLocation } from "@/lib/amap";

// POST /api/geocode — address → { lng, lat }
export async function POST(request: Request) {
  const { address } = await request.json();
  if (!address?.trim()) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const result = await geocode(address.trim());
  if (!result) {
    return NextResponse.json({ error: "geocode failed" }, { status: 404 });
  }

  const [lng, lat] = parseLocation(result.location);
  return NextResponse.json({ lng, lat, formatted_address: result.formatted_address });
}
