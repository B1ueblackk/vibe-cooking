/**
 * 高德地图 API helpers.
 * JS API is browser-only (loaded via <script>); this file wraps server-side REST API calls.
 */

const AMAP_SERVER_KEY = process.env.AMAP_SERVER_KEY || "";
const AMAP_BASE = "https://restapi.amap.com/v3";

export interface AmapPOI {
  id: string;
  name: string;
  address: string;
  location: string; // "lng,lat"
  type: string;
}

export interface GeocodingResult {
  formatted_address: string;
  location: string; // "lng,lat"
  province: string;
  city: string;
  district: string;
}

/** Search nearby POIs (restaurants, etc.) */
export async function searchPOI(
  keyword: string,
  city?: string
): Promise<AmapPOI[]> {
  const params = new URLSearchParams({
    key: AMAP_SERVER_KEY,
    keywords: keyword,
    types: "050000", // catering
    city: city || "",
    citylimit: city ? "true" : "false",
    output: "json",
  });

  const res = await fetch(`${AMAP_BASE}/place/text?${params}`);
  const data = await res.json();

  if (data.status !== "1") {
    throw new Error(`AMap API error: ${data.info}`);
  }

  return (data.pois || []).map((poi: Record<string, string>) => ({
    id: poi.id,
    name: poi.name,
    address: poi.address,
    location: poi.location,
    type: poi.type,
  }));
}

/** Geocode: address → coordinates */
export async function geocode(address: string): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    key: AMAP_SERVER_KEY,
    address,
    output: "json",
  });

  const res = await fetch(`${AMAP_BASE}/geocode/geo?${params}`);
  const data = await res.json();

  if (data.status !== "1" || !data.geocodes?.length) return null;

  const g = data.geocodes[0];
  return {
    formatted_address: g.formatted_address,
    location: g.location,
    province: g.province,
    city: g.city,
    district: g.district,
  };
}

/** Reverse geocode: coordinates → address */
export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<string | null> {
  const params = new URLSearchParams({
    key: AMAP_SERVER_KEY,
    location: `${lng},${lat}`,
    output: "json",
  });

  const res = await fetch(`${AMAP_BASE}/geocode/regeo?${params}`);
  const data = await res.json();

  if (data.status !== "1") return null;
  return data.regeocode?.formatted_address || null;
}

/** Parse "lng,lat" string to [number, number] */
export function parseLocation(location: string): [number, number] {
  const [lng, lat] = location.split(",").map(Number);
  return [lng, lat];
}
