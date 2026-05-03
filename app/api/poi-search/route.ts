import { NextResponse } from "next/server";

const AMAP_SERVER_KEY = process.env.AMAP_SERVER_KEY || "";

// GET /api/poi-search?keyword=东方明珠&city=上海
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");
  const city = searchParams.get("city") || "上海";

  if (!keyword?.trim()) {
    return NextResponse.json([]);
  }

  // Use AMap inputtips API for autocomplete suggestions
  const params = new URLSearchParams({
    key: AMAP_SERVER_KEY,
    keywords: keyword,
    city,
    citylimit: "false",
    datatype: "poi",
    output: "json",
  });

  const res = await fetch(`https://restapi.amap.com/v3/assistant/inputtips?${params}`);
  const data = await res.json();

  if (data.status !== "1") {
    return NextResponse.json([]);
  }

  // Filter out results without location
  const tips = (data.tips || [])
    .filter((t: Record<string, string>) => t.location && t.location.includes(","))
    .slice(0, 8)
    .map((t: Record<string, string>) => {
      const [lng, lat] = t.location.split(",").map(Number);
      return {
        name: t.name,
        address: t.address || t.district || "",
        district: t.district || "",
        lng,
        lat,
      };
    });

  return NextResponse.json(tips);
}
