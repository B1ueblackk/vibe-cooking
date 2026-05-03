"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/lib/types";

const CUISINE_EMOJI: Record<string, string> = {
  中餐: "🍜", 日料: "🍣", 火锅: "🥘", 甜品: "🍰",
  川菜: "🌶️", 粤菜: "🥡", 西餐: "🍝", 韩餐: "🍖",
  烧烤: "🍢", 咖啡: "☕", 面包: "🥐", 东南亚: "🍛",
};

function getCuisineEmoji(restaurant: Restaurant): string {
  const cuisine = restaurant.tags?.find((t) => t.type === "cuisine")?.name;
  if (cuisine && CUISINE_EMOJI[cuisine]) return CUISINE_EMOJI[cuisine];
  return "📍";
}

function getCuisineName(restaurant: Restaurant): string {
  return restaurant.tags?.find((t) => t.type === "cuisine")?.name ?? "";
}

export default function FoodMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/restaurants")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRestaurants(data);
      })
      .catch(() => {});
  }, []);

  const closeBubble = useCallback(() => {
    if (bubbleRef.current) {
      bubbleRef.current.style.opacity = "0";
      bubbleRef.current.style.transform = "translate(-50%, -100%) scale(0.8)";
      setTimeout(() => {
        bubbleRef.current?.remove();
        bubbleRef.current = null;
      }, 200);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || restaurants.length === 0) return;

    let mapInstance: unknown = null;

    (window as unknown as Record<string, unknown>)._AMapSecurityConfig = {
      securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_KEY || "",
    };

    import("@amap/amap-jsapi-loader").then((AMapLoader) => {
      AMapLoader.default
        .load({
          key: process.env.NEXT_PUBLIC_AMAP_KEY || "",
          version: "2.0",
        })
        .then((AMap: typeof window.AMap) => {
          if (!mapRef.current) return;

          const center = restaurants.length > 0
            ? [restaurants[0].longitude, restaurants[0].latitude]
            : [121.4650, 31.2280];

          const map = new AMap.Map(mapRef.current, {
            zoom: 13,
            center,
            mapStyle: "amap://styles/whitesmoke",
            viewMode: "2D",
            dragEnable: true,
            zoomEnable: true,
            touchZoom: true,
          });

          mapInstance = map;

          // Track drag vs click
          let isDragging = false;
          map.on("dragstart", () => { isDragging = true; });
          map.on("dragend", () => { setTimeout(() => { isDragging = false; }, 50); });

          // Click on map (not drag) → close bubble & deselect
          map.on("click", () => {
            if (isDragging) return;
            closeBubble();
            setSelected(null);
          });

          function showBubble(r: Restaurant) {
            if (bubbleRef.current) {
              bubbleRef.current.remove();
              bubbleRef.current = null;
            }

            const cuisine = getCuisineName(r);
            const ratingStars = r.rating ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "";

            const bubble = document.createElement("div");
            bubble.style.cssText = `
              position: absolute; z-index: 200; pointer-events: none;
              opacity: 0; transform: translate(-50%, -100%) scale(0.8);
              transition: opacity 0.25s cubic-bezier(0.34,1.56,0.64,1), transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
            `;
            bubble.innerHTML = `
              <div style="
                background: white;
                border-radius: 14px;
                padding: 10px 14px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
                font-family: system-ui, -apple-system, sans-serif;
                min-width: 130px;
                max-width: 200px;
                position: relative;
              ">
                <div style="font-weight:600;font-size:13px;color:#2C1810;margin-bottom:3px;">${r.name}</div>
                <div style="font-size:11px;color:#8B6F5E;">
                  ${cuisine}${r.costAvg ? ` · ¥${r.costAvg}/人` : ""}
                </div>
                ${ratingStars ? `<div style="color:#D4A574;font-size:10px;margin-top:2px;letter-spacing:1px;">${ratingStars}</div>` : ""}
                ${r.signatureDishes?.length ? `<div style="font-size:10px;color:#6B7B5E;margin-top:3px;">${r.signatureDishes.slice(0, 2).join(" · ")}</div>` : ""}
                <div style="
                  position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
                  width: 12px; height: 12px; background: white;
                  border-radius: 2px; transform: translateX(-50%) rotate(45deg);
                  box-shadow: 2px 2px 4px rgba(0,0,0,0.06);
                "></div>
              </div>
            `;

            const pixel = (map as unknown as { lngLatToContainer: (lnglat: unknown) => { x: number; y: number } })
              .lngLatToContainer(new AMap.LngLat(r.longitude, r.latitude));
            bubble.style.left = `${pixel.x}px`;
            bubble.style.top = `${pixel.y - 26}px`;

            mapRef.current!.appendChild(bubble);
            bubbleRef.current = bubble;

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                bubble.style.opacity = "1";
                bubble.style.transform = "translate(-50%, -100%) scale(1)";
              });
            });

            const updatePos = () => {
              const p = (map as unknown as { lngLatToContainer: (lnglat: unknown) => { x: number; y: number } })
                .lngLatToContainer(new AMap.LngLat(r.longitude, r.latitude));
              bubble.style.left = `${p.x}px`;
              bubble.style.top = `${p.y - 26}px`;
            };
            map.on("mapmove", updatePos);
            map.on("zoomchange", updatePos);
          }

          restaurants.forEach((r) => {
            const emoji = getCuisineEmoji(r);

            const el = document.createElement("div");
            el.className = "amap-food-pin";
            el.innerHTML = `<div style="
              width: 36px; height: 36px;
              background: white;
              border-radius: 50%;
              box-shadow: 0 2px 12px rgba(0,0,0,0.15);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              cursor: pointer;
              transition: transform 0.2s, box-shadow 0.2s;
            ">${emoji}</div>`;

            const marker = new AMap.Marker({
              position: new AMap.LngLat(r.longitude, r.latitude),
              content: el,
              offset: new AMap.Pixel(-18, -18),
              draggable: false,
            });

            marker.on("click", (e: { originEvent?: { stopPropagation: () => void; preventDefault: () => void } }) => {
              e.originEvent?.stopPropagation();
              e.originEvent?.preventDefault();

              showBubble(r);
              setSelected(r);
              map.panTo(new AMap.LngLat(r.longitude, r.latitude));
            });

            map.add(marker);
          });

          if (restaurants.length > 1) {
            map.setFitView(undefined, false, [50, 50, 50, 50]);
          }

          setMapLoaded(true);
        })
        .catch((e: Error) => {
          console.error("AMap load failed:", e);
        });
    });

    return () => {
      if (bubbleRef.current) {
        bubbleRef.current.remove();
        bubbleRef.current = null;
      }
      if (mapInstance && typeof (mapInstance as { destroy: () => void }).destroy === "function") {
        (mapInstance as { destroy: () => void }).destroy();
      }
    };
  }, [restaurants, closeBubble]);

  const visitedCount = restaurants.filter((r) => r.status === "visited").length;
  const dishCount = restaurants.reduce((sum, r) => sum + (r.signatureDishes?.length ?? 0), 0);
  const cityCount = new Set(restaurants.map((r) => r.address.match(/^(.+?[市省区])/)?.[1]).filter(Boolean)).size || 1;

  return (
    <section className="mx-5 bg-white rounded-3xl overflow-hidden shadow-[var(--shadow-vc-md)]">
      {/* Fixed height container — bottom card slides in over the map */}
      <div className="h-48 relative overflow-hidden amap-no-watermark">
        <div ref={mapRef} className="w-full h-full" />

        {!mapLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8D5B7] via-[#D4B896] to-[#BFA17A] flex items-center justify-center">
            <span className="text-sm text-white/70">地图加载中...</span>
          </div>
        )}

        {/* Stats overlay — compact, semi-transparent */}
        <div
          className={`absolute left-3 bg-white/75 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 z-10 transition-all duration-300 ${
            selected ? "bottom-[60px]" : "bottom-2.5"
          }`}
        >
          <div className="text-center">
            <div className="font-serif text-sm text-vc-brown-dark leading-tight">{visitedCount}</div>
            <div className="text-[0.58rem] text-vc-brown-light">餐厅</div>
          </div>
          <div className="w-px h-5 bg-black/8" />
          <div className="text-center">
            <div className="font-serif text-sm text-vc-brown-dark leading-tight">{dishCount}</div>
            <div className="text-[0.58rem] text-vc-brown-light">菜品</div>
          </div>
          <div className="w-px h-5 bg-black/8" />
          <div className="text-center">
            <div className="font-serif text-sm text-vc-brown-dark leading-tight">{cityCount}</div>
            <div className="text-[0.58rem] text-vc-brown-light">城市</div>
          </div>
        </div>

        {/* Bottom card — slides up inside the map area */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-black/5 z-20 transition-transform duration-300 ease-out ${
            selected ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {selected && (
            <div className="px-4 py-2.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-vc-cream-deep to-vc-sage-muted flex items-center justify-center text-lg shrink-0">
                {getCuisineEmoji(selected)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[0.82rem] font-semibold text-vc-brown-dark truncate">{selected.name}</h4>
                <p className="text-[0.68rem] text-vc-brown-light truncate">
                  {getCuisineName(selected)}
                  {selected.costAvg ? ` · ¥${selected.costAvg}/人` : ""}
                  {" · "}
                  {selected.address.slice(0, 12)}
                </p>
              </div>
              <button
                onClick={() => router.push(`/explore?rid=${selected.id}`)}
                className="w-7 h-7 rounded-full bg-vc-cream-deep flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              >
                <ChevronRight size={14} className="text-vc-brown-medium" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
