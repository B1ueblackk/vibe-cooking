"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X, SlidersHorizontal, Users } from "lucide-react";
import { CUISINE_COLORS, CUISINE_HIERARCHY } from "@/lib/constants";
import type { RestaurantStatus, RestaurantFilterPayload } from "@/lib/types";
import FriendSidebar from "@/components/map/FriendSidebar";

const TOP_CUISINES = ["中餐", "日料", "韩餐", "意餐", "法餐", "东南亚", "西餐", "火锅", "烧烤", "甜品", "咖啡", "小吃"];
const TASTE_OPTIONS = ["辣", "清淡", "甜", "咸鲜", "酸", "麻", "鲜香"];

const DEFAULT_FILTERS: RestaurantFilterPayload = {
  cuisines: [],
  tastes: [],
  status: [],
  maxCost: null,
  minCost: null,
  minRating: null,
  friendIds: [],
};

interface Props {
  filters: RestaurantFilterPayload;
  onChange: (f: RestaurantFilterPayload) => void;
  resultCount: number;
  onClose: () => void;
}

export default function FilterPanel({ filters, onChange, resultCount, onClose }: Props) {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [friendSidebarOpen, setFriendSidebarOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCuisine = (name: string) => {
    const arr = filters.cuisines;
    onChange({ ...filters, cuisines: arr.includes(name) ? arr.filter((n) => n !== name) : [...arr, name] });
  };

  const toggleTaste = (name: string) => {
    const arr = filters.tastes;
    onChange({ ...filters, tastes: arr.includes(name) ? arr.filter((n) => n !== name) : [...arr, name] });
  };

  const toggleStatus = (s: RestaurantStatus) => {
    const arr = filters.status;
    onChange({ ...filters, status: arr.includes(s) ? arr.filter((n) => n !== s) : [...arr, s] });
  };

  const activeCount =
    filters.cuisines.length +
    filters.tastes.length +
    filters.status.length +
    filters.friendIds.length +
    (filters.maxCost ? 1 : 0) +
    (filters.minRating ? 1 : 0);

  const clearAll = () => onChange(DEFAULT_FILTERS);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] max-h-[75vh] bg-white rounded-t-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-vc-cream-deep">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-vc-terracotta" />
            <h2 className="font-serif text-lg">筛选</h2>
            {activeCount > 0 && (
              <span className="bg-vc-terracotta text-white text-[0.68rem] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-[0.78rem] text-vc-terracotta font-medium">
                清除全部
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-vc-cream-deep flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Friends filter — button opens sidebar */}
          <div>
            <p className="text-[0.78rem] font-semibold text-vc-brown-medium mb-2">
              好友餐厅 {filters.friendIds.length > 0 && <span className="text-vc-terracotta">({filters.friendIds.length})</span>}
            </p>
            <button
              onClick={() => setFriendSidebarOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.82rem] font-medium transition-all ${
                filters.friendIds.length > 0
                  ? "bg-vc-forest text-white"
                  : "bg-vc-cream-deep text-vc-brown-medium active:bg-vc-cream-deep/70"
              }`}
            >
              <Users size={15} />
              {filters.friendIds.length > 0 ? `已选 ${filters.friendIds.length} 位好友` : "选择好友"}
            </button>
          </div>

          {/* Friend sidebar */}
          <FriendSidebar
            open={friendSidebarOpen}
            onClose={() => setFriendSidebarOpen(false)}
            selectedIds={filters.friendIds}
            onToggle={(id) => {
              const arr = filters.friendIds;
              onChange({ ...filters, friendIds: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] });
            }}
          />

          {/* Status */}
          <div>
            <p className="text-[0.78rem] font-semibold text-vc-brown-medium mb-2">状态</p>
            <div className="flex gap-2">
              {(["visited", "want"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={`px-4 py-2 rounded-xl text-[0.82rem] font-medium transition-all ${
                    filters.status.includes(s)
                      ? s === "visited" ? "bg-vc-forest text-white" : "bg-vc-amber text-white"
                      : "bg-vc-cream-deep text-vc-brown-medium"
                  }`}
                >
                  {s === "visited" ? "✓ 已去过" : "★ 想去"}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine tags with hierarchy */}
          <div>
            <p className="text-[0.78rem] font-semibold text-vc-brown-medium mb-2">
              菜系 {filters.cuisines.length > 0 && <span className="text-vc-terracotta">({filters.cuisines.length})</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {TOP_CUISINES.map((c) => {
                const active = filters.cuisines.includes(c);
                const hasChildren = CUISINE_HIERARCHY[c];
                const isExpanded = expandedParents.has(c);
                const color = CUISINE_COLORS[c] ?? "#8B6F5E";

                return (
                  <div key={c} className="contents">
                    <button
                      onClick={() => {
                        if (hasChildren) toggleExpand(c);
                        else toggleCuisine(c);
                      }}
                      className="px-3 py-1.5 rounded-full text-[0.78rem] font-medium border-[1.5px] transition-all inline-flex items-center gap-1"
                      style={{
                        background: active ? color : "transparent",
                        borderColor: active ? color : "#e5e0db",
                        color: active ? "white" : "#5C3D2E",
                      }}
                    >
                      {c}
                      {hasChildren && (
                        isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </button>

                    {/* Sub-cuisines */}
                    {hasChildren && isExpanded && CUISINE_HIERARCHY[c].map((sub) => {
                      const subActive = filters.cuisines.includes(sub);
                      const subColor = CUISINE_COLORS[sub] ?? color;
                      return (
                        <button
                          key={sub}
                          onClick={() => toggleCuisine(sub)}
                          className="px-2.5 py-1 rounded-full text-[0.72rem] font-medium border transition-all"
                          style={{
                            background: subActive ? subColor : "transparent",
                            borderColor: subActive ? subColor : "#e5e0db",
                            color: subActive ? "white" : "#8B6F5E",
                          }}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Taste */}
          <div>
            <p className="text-[0.78rem] font-semibold text-vc-brown-medium mb-2">口味</p>
            <div className="flex flex-wrap gap-2">
              {TASTE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTaste(t)}
                  className={`px-3 py-1.5 rounded-full text-[0.78rem] font-medium border-[1.5px] transition-all ${
                    filters.tastes.includes(t)
                      ? "bg-vc-brown-dark text-white border-vc-brown-dark"
                      : "bg-transparent text-vc-brown-medium border-[#e5e0db]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p className="text-[0.78rem] font-semibold text-vc-brown-medium mb-2">人均消费</p>
            <div className="flex gap-2">
              {[
                { label: "≤50", max: 50 },
                { label: "50-100", max: 100 },
                { label: "100-200", max: 200 },
                { label: "200+", max: 9999 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() =>
                    onChange({
                      ...filters,
                      maxCost: filters.maxCost === p.max ? null : p.max,
                    })
                  }
                  className={`flex-1 py-2 rounded-xl text-[0.78rem] font-medium transition-all ${
                    filters.maxCost === p.max
                      ? "bg-vc-terracotta text-white"
                      : "bg-vc-cream-deep text-vc-brown-medium"
                  }`}
                >
                  ¥{p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-[0.78rem] font-semibold text-vc-brown-medium mb-2">最低评分</p>
            <div className="flex gap-2">
              {[3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => onChange({ ...filters, minRating: filters.minRating === r ? null : r })}
                  className={`flex-1 py-2 rounded-xl text-[0.78rem] font-medium transition-all flex items-center justify-center gap-1 ${
                    filters.minRating === r
                      ? "bg-vc-amber text-white"
                      : "bg-vc-cream-deep text-vc-brown-medium"
                  }`}
                >
                  {r}+ <span className="text-[0.72rem]">★</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply button */}
        <div className="px-6 py-4 border-t border-vc-cream-deep">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-vc-terracotta to-vc-terracotta-dark text-white font-semibold text-[0.92rem] shadow-[var(--shadow-vc-glow)]"
          >
            查看 {resultCount} 个结果
          </button>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_FILTERS };
export type { Props as FilterPanelProps };
