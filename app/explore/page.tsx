"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, List, Map as MapIcon, SlidersHorizontal, Plus, Star, ChevronRight } from "lucide-react";
import { CUISINE_COLORS, CUISINE_EMOJI, CUISINE_BG, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import type { Restaurant, RestaurantStatus, RestaurantFilterPayload } from "@/lib/types";
import AddRestaurantModal from "@/components/map/AddRestaurantModal";
import FilterPanel, { DEFAULT_FILTERS } from "@/components/sidebar/FilterPanel";

type ViewMode = "map" | "list";

// ==================
// Pin color helper
// ==================

function getPinColor(r: Restaurant): string {
  const cuisineTag = r.tags.find((t) => t.type === "cuisine");
  return CUISINE_COLORS[cuisineTag?.name ?? ""] ?? "#8B6F5E";
}

function getPinEmoji(r: Restaurant): string {
  const cuisineTag = r.tags.find((t) => t.type === "cuisine");
  return CUISINE_EMOJI[cuisineTag?.name ?? ""] ?? "🍴";
}

function getCuisineBg(r: Restaurant): string {
  const cuisineTag = r.tags.find((t) => t.type === "cuisine");
  return CUISINE_BG[cuisineTag?.name ?? ""] ?? "#F5EBE0";
}

// ==================
// Filter logic (client-side)
// ==================

function applyFilters(restaurants: Restaurant[], filters: RestaurantFilterPayload, query: string): Restaurant[] {
  return restaurants.filter((r) => {
    if (query) {
      const q = query.toLowerCase();
      const match =
        r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.name.includes(q)) ||
        r.signatureDishes.some((d) => d.includes(q)) ||
        (r.address && r.address.includes(q));
      if (!match) return false;
    }
    if (filters.cuisines.length > 0) {
      const rCuisines = r.tags.filter((t) => t.type === "cuisine").map((t) => t.name);
      if (!filters.cuisines.some((c) => rCuisines.includes(c))) return false;
    }
    if (filters.tastes.length > 0) {
      const rTastes = r.tags.filter((t) => t.type === "taste").map((t) => t.name);
      if (!filters.tastes.some((t) => rTastes.includes(t))) return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(r.status)) return false;
    if (filters.maxCost && r.costAvg && r.costAvg > filters.maxCost) return false;
    if (filters.minRating && (!r.rating || r.rating < filters.minRating)) return false;
    return true;
  });
}

// ==================
// DB row → Restaurant type adapter
// ==================

function toRestaurant(row: Record<string, unknown>): Restaurant {
  return {
    id: row.id as string,
    userId: row.userId as string,
    name: row.name as string,
    address: row.address as string,
    longitude: row.longitude as number,
    latitude: row.latitude as number,
    tags: (row.tags ?? []) as Restaurant["tags"],
    costAvg: (row.costAvg ?? undefined) as number | undefined,
    rating: (row.rating ?? undefined) as number | undefined,
    signatureDishes: (row.signatureDishes ?? []) as string[],
    notes: (row.notes ?? undefined) as string | undefined,
    status: row.status as RestaurantStatus,
    createdAt: row.createdAt as string,
  };
}

// ==================
// Explore Page
// ==================

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const mapRef = useRef<HTMLDivElement>(null);
  const amapRef = useRef<{ map: unknown; markers: unknown[]; AMap: typeof window.AMap } | null>(null);
  const restaurantsRef = useRef<Restaurant[]>([]);
  const searchParams = useSearchParams();
  const focusRid = searchParams.get("rid");

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [view, setView] = useState<ViewMode>("map");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<RestaurantFilterPayload>(DEFAULT_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editRestaurant, setEditRestaurant] = useState<Restaurant | null>(null);
  const [addCoords, setAddCoords] = useState<{ lng: number; lat: number } | null>(null);

  // Selected restaurant
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = applyFilters(restaurants, filters, query);
  const visitedCount = restaurants.filter((r) => r.status === "visited").length;
  const wantCount = restaurants.filter((r) => r.status === "want").length;

  // Keep ref in sync for InfoWindow edit callback
  restaurantsRef.current = restaurants;

  // ==================
  // Fetch restaurants from API
  // ==================

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch("/api/restaurants");
      const rows = await res.json();
      setRestaurants(rows.map(toRestaurant));
    } catch (e) {
      console.error("Failed to fetch restaurants:", e);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // ==================
  // Map initialization & marker rendering
  // ==================

  const renderMarkers = useCallback(
    (AMap: typeof window.AMap, map: unknown, data: Restaurant[], selected: string | null) => {
      if (amapRef.current?.markers) {
        (amapRef.current.markers as { remove: () => void }[]).forEach((m) => {
          (map as { remove: (m: unknown) => void }).remove(m);
        });
      }

      const markers: unknown[] = [];

      data.forEach((r) => {
        const color = getPinColor(r);
        const emoji = getPinEmoji(r);
        const isSelected = selected === r.id;
        const isWant = r.status === "want";

        const svgPin = isWant
          ? `<svg width="28" height="38" viewBox="0 0 24 32"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${isSelected ? "#2C1810" : "white"}" stroke="${isSelected ? "#2C1810" : color}" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="${isSelected ? "white" : color}"/></svg>`
          : `<svg width="28" height="38" viewBox="0 0 24 32"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${isSelected ? "#2C1810" : color}"/><circle cx="12" cy="12" r="5" fill="white" fill-opacity="0.92"/></svg>`;

        const el = document.createElement("div");
        el.innerHTML = `<div style="cursor:pointer;transform:${isSelected ? "scale(1.3) translateY(-3px)" : "scale(1)"};filter:${isSelected ? "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"};transition:all 0.2s;">${svgPin}</div>`;

        const marker = new AMap.Marker({
          position: new AMap.LngLat(r.longitude, r.latitude),
          content: el,
          offset: new AMap.Pixel(-14, -38),
        });

        const cuisineTag = r.tags.find((t) => t.type === "cuisine")?.name ?? "";
        const ratingStars = r.rating ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "";
        const dishesHtml = r.signatureDishes.length
          ? `<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">${r.signatureDishes.map((d) => `<span style="background:${getCuisineBg(r)};color:${color};font-size:11px;padding:2px 8px;border-radius:10px;">${d}</span>`).join("")}</div>`
          : "";

        const info = new AMap.InfoWindow({
          content: `<div style="padding:12px 16px;font-family:system-ui;min-width:200px;max-width:260px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="font-size:18px;">${emoji}</span>
              <strong style="font-size:15px;">${r.name}</strong>
              <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${r.status === "visited" ? "#EDFFEF" : "#FFF9E6"};color:${r.status === "visited" ? "#2D6A4F" : "#E9C46A"};">${r.status === "visited" ? "已去" : "想去"}</span>
            </div>
            <div style="color:#8B6F5E;font-size:12px;">${cuisineTag}${r.costAvg ? ` · 人均 ¥${r.costAvg}` : ""}</div>
            ${ratingStars ? `<div style="color:#E9C46A;font-size:12px;margin-top:2px;">${ratingStars}</div>` : ""}
            ${r.address ? `<div style="color:#8B6F5E;font-size:11px;margin-top:4px;">📍 ${r.address}</div>` : ""}
            ${dishesHtml}
            ${r.notes ? `<div style="color:#8B6F5E;font-size:11px;margin-top:6px;font-style:italic;">"${r.notes}"</div>` : ""}
            <div style="margin-top:8px;display:flex;gap:6px;">
              <button onclick="window.__vcEditRestaurant('${r.id}')" style="font-size:12px;padding:4px 12px;border-radius:8px;background:#F5EBE0;border:none;cursor:pointer;color:#5C3D2E;">编辑</button>
            </div>
          </div>`,
          offset: new AMap.Pixel(0, -42),
        });

        marker.on("click", () => {
          setSelectedId(r.id);
          info.open(map as unknown as typeof AMap.Map, new AMap.LngLat(r.longitude, r.latitude));
        });

        (map as { add: (m: unknown) => void }).add(marker);
        markers.push(marker);
      });

      if (amapRef.current) amapRef.current.markers = markers;
    },
    []
  );

  // Init map once on mount (map DOM is always present, hidden via CSS)
  useEffect(() => {
    if (!mapRef.current) return;

    let destroyed = false;

    (window as unknown as Record<string, unknown>)._AMapSecurityConfig = {
      securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_KEY || "",
    };

    (window as unknown as Record<string, (id: string) => void>).__vcEditRestaurant = (id: string) => {
      const r = restaurantsRef.current.find((x) => x.id === id);
      if (r) setEditRestaurant(r);
    };

    const initMap = (AMap: typeof window.AMap) => {
      if (destroyed || !mapRef.current) return;

      const map = new AMap.Map(mapRef.current, {
        zoom: DEFAULT_MAP_ZOOM,
        center: [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
        mapStyle: "amap://styles/whitesmoke",
        viewMode: "2D",
      });

      // Try to center on user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!destroyed) {
              map.setCenter(new AMap.LngLat(pos.coords.longitude, pos.coords.latitude));
            }
          },
          () => {}, // silently fall back to default
          { timeout: 5000, enableHighAccuracy: false }
        );
      }

      amapRef.current = { map, markers: [], AMap };

      map.on("click", (e: { lnglat: { getLng: () => number; getLat: () => number } }) => {
        setAddCoords({ lng: e.lnglat.getLng(), lat: e.lnglat.getLat() });
        setAddModalOpen(true);
      });

      renderMarkers(AMap, map, filtered, selectedId);
      setMapReady(true);
    };

    // If AMap is already loaded globally, reuse it
    if (window.AMap) {
      initMap(window.AMap);
    } else {
      import("@amap/amap-jsapi-loader").then((AMapLoader) => {
        AMapLoader.default
          .load({ key: process.env.NEXT_PUBLIC_AMAP_KEY || "", version: "2.0" })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((AMap: any) => {
            initMap(AMap);
          })
          .catch((err: unknown) => {
            console.error("AMap load error:", err);
          });
      });
    }

    return () => {
      destroyed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers synchronously (no async re-load) when data/selection changes
  useEffect(() => {
    if (!amapRef.current || view !== "map") return;
    renderMarkers(amapRef.current.AMap, amapRef.current.map, filtered, selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, selectedId]);

  // Auto-focus restaurant from query param (?rid=xxx)
  useEffect(() => {
    if (!focusRid || !mapReady || !amapRef.current || restaurants.length === 0) return;
    const r = restaurants.find((x) => x.id === focusRid);
    if (!r) return;

    const { AMap, map } = amapRef.current;
    setSelectedId(r.id);
    (map as { setZoomAndCenter: (z: number, c: unknown) => void }).setZoomAndCenter(
      15,
      new AMap.LngLat(r.longitude, r.latitude)
    );
  }, [focusRid, mapReady, restaurants]);

  // ==================
  // CRUD handlers (via API)
  // ==================

  const handleSave = async (data: {
    name: string; address: string; lng: number; lat: number;
    costAvg: number | null; rating: number | null; signatureDishes: string[];
    notes: string; status: RestaurantStatus; cuisines: string[]; tastes: string[];
  }) => {
    const payload = { ...data };

    // If coordinates are default center and address is provided, geocode it
    const isDefaultCoords =
      Math.abs(payload.lng - DEFAULT_MAP_CENTER.lng) < 0.001 &&
      Math.abs(payload.lat - DEFAULT_MAP_CENTER.lat) < 0.001;

    if (isDefaultCoords && payload.address.trim()) {
      try {
        const geoRes = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: payload.address }),
        });
        if (geoRes.ok) {
          const { lng, lat } = await geoRes.json();
          payload.lng = lng;
          payload.lat = lat;
        }
      } catch (e) {
        console.error("Geocode failed:", e);
      }
    }

    if (editRestaurant) {
      await fetch(`/api/restaurants/${editRestaurant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setAddModalOpen(false);
    setEditRestaurant(null);
    fetchRestaurants();
  };

  const handleDelete = async () => {
    if (editRestaurant) {
      await fetch(`/api/restaurants/${editRestaurant.id}`, { method: "DELETE" });
      setEditRestaurant(null);
      fetchRestaurants();
    }
  };

  const filterActiveCount =
    filters.cuisines.length + filters.tastes.length + filters.status.length +
    (filters.maxCost ? 1 : 0) + (filters.minRating ? 1 : 0);

  // ==================
  // Render
  // ==================

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden z-0">
      {/* Header */}
      <div className="pt-14 px-5 pb-3 bg-vc-cream shrink-0">
        <h1 className="font-serif text-2xl text-vc-brown-dark mb-4">探索美食</h1>

        {/* Search + actions */}
        <div className="flex gap-2.5">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-[var(--shadow-vc-sm)]">
            <Search size={18} className="text-vc-brown-light shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索餐厅、菜系、招牌菜..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-vc-brown-light/60"
            />
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className="relative w-12 h-12 rounded-2xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center text-vc-brown-medium active:scale-95 transition-transform"
          >
            <SlidersHorizontal size={20} />
            {filterActiveCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-vc-terracotta text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center">
                {filterActiveCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setView(view === "map" ? "list" : "map")}
            className="w-12 h-12 rounded-2xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center text-vc-brown-medium active:scale-95 transition-transform"
          >
            {view === "map" ? <List size={20} /> : <MapIcon size={20} />}
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-3">
          <span className="text-[0.75rem] text-vc-brown-light">
            <span className="font-semibold text-vc-forest">{visitedCount}</span> 已探访
          </span>
          <span className="text-[0.75rem] text-vc-brown-light">
            <span className="font-semibold text-vc-amber-warm">{wantCount}</span> 想去
          </span>
          <span className="text-[0.75rem] text-vc-brown-light ml-auto">
            共 <span className="font-semibold text-vc-brown-dark">{filtered.length}</span> 家
          </span>
        </div>
      </div>

      {/* Content */}
      {/* Map view — always mounted, hidden via CSS to preserve DOM */}
      <div className={`flex-1 relative ${view === "map" ? "" : "hidden"}`}>
          <div ref={mapRef} className="w-full h-full" />
          {!mapReady && (
            <div className="absolute inset-0 bg-vc-cream-deep flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-vc-brown-light">地图加载中...</span>
              </div>
            </div>
          )}

          {/* Add button (floating) */}
          <button
            onClick={() => { setAddCoords(null); setAddModalOpen(true); }}
            className="absolute bottom-20 right-5 w-14 h-14 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-terracotta-dark text-white shadow-[var(--shadow-vc-glow)] flex items-center justify-center active:scale-95 transition-transform z-10"
          >
            <Plus size={24} />
          </button>

          {/* Map legend */}
          <div className="absolute top-3 left-3 bg-white/92 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-3 z-10">
            <div className="flex items-center gap-1.5">
              <svg width="10" height="14" viewBox="0 0 24 32"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#2D6A4F"/><circle cx="12" cy="12" r="5" fill="white" fillOpacity="0.92"/></svg>
              <span className="text-[0.65rem] text-vc-brown-light">已去</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="10" height="14" viewBox="0 0 24 32"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="white" stroke="#E9C46A" strokeWidth="2"/><circle cx="12" cy="12" r="3.5" fill="#E9C46A"/></svg>
              <span className="text-[0.65rem] text-vc-brown-light">想去</span>
            </div>
          </div>
        </div>

      {/* List view */}
      {view === "list" && (
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-24 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-vc-brown-light">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-sm">没有找到匹配的餐厅</p>
            </div>
          ) : (
            filtered.map((r) => {
              const cuisineTag = r.tags.find((t) => t.type === "cuisine");
              const color = getPinColor(r);
              const bg = getCuisineBg(r);
              const emoji = getPinEmoji(r);

              return (
                <div
                  key={r.id}
                  onClick={() => setEditRestaurant(r)}
                  className="bg-white rounded-2xl p-4 shadow-[var(--shadow-vc-sm)] flex gap-3.5 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: bg }}
                  >
                    {emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[0.92rem] font-semibold truncate">{r.name}</h3>
                      {r.rating && (
                        <span className="text-[0.68rem] font-medium px-1.5 py-0.5 rounded bg-vc-amber/15 text-vc-amber-warm shrink-0">
                          {r.rating}★
                        </span>
                      )}
                    </div>
                    <p className="text-[0.75rem] text-vc-brown-light">
                      {cuisineTag?.name ?? ""}
                      {r.costAvg ? ` · 人均 ¥${r.costAvg}` : ""}
                    </p>
                    {r.signatureDishes.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {r.signatureDishes.slice(0, 3).map((d) => (
                          <span
                            key={d}
                            className="text-[0.68rem] px-2 py-0.5 rounded-full"
                            style={{ background: bg, color }}
                          >
                            {d}
                          </span>
                        ))}
                        {r.signatureDishes.length > 3 && (
                          <span className="text-[0.68rem] text-vc-brown-light">+{r.signatureDishes.length - 3}</span>
                        )}
                      </div>
                    )}
                    {r.notes && (
                      <p className="text-[0.72rem] text-vc-brown-light mt-1 italic line-clamp-1">&ldquo;{r.notes}&rdquo;</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between shrink-0">
                    <span
                      className="text-[0.68rem] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: r.status === "visited" ? "#EDFFEF" : "#FFF9E6",
                        color: r.status === "visited" ? "#2D6A4F" : "#d4a030",
                      }}
                    >
                      {r.status === "visited" ? "已去" : "想去"}
                    </span>
                    <ChevronRight size={14} className="text-vc-brown-light/40" />
                  </div>
                </div>
              );
            })
          )}

          <button
            onClick={() => { setAddCoords(null); setAddModalOpen(true); }}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-vc-terracotta/30 text-vc-terracotta font-medium text-sm flex items-center justify-center gap-2 active:bg-vc-terracotta/5 transition-all"
          >
            <Plus size={18} /> 添加餐厅
          </button>
        </div>
      )}

      {/* Filter panel */}
      {showFilter && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={filtered.length}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* Add / Edit Modal */}
      {(addModalOpen || editRestaurant) && (
        <AddRestaurantModal
          restaurant={editRestaurant}
          coordinates={addCoords}
          onSave={handleSave}
          onClose={() => { setAddModalOpen(false); setEditRestaurant(null); }}
          onDelete={editRestaurant ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
