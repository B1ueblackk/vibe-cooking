"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Check } from "lucide-react";

interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
  category: string;
  sources: string[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  "蔬菜": "🥬", "肉类": "🥩", "海鲜": "🦐", "蛋奶": "🥚",
  "主食": "🍚", "豆制品": "🫘", "调料": "🧂", "水果": "🍎", "其他": "📦",
};

export default function ShoppingListPage() {
  const router = useRouter();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/mealplan/shopping-list")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setItems(data.items);
        if (data.weekStart) setWeekStart(data.weekStart);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>();
    for (const item of items) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  const toggle = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const checkedCount = checked.size;
  const totalCount = items.length;

  return (
    <div className="pt-14 pb-24 min-h-screen bg-vc-cream">
      {/* Header */}
      <div className="px-5 mb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-vc-brown-dark" />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-xl text-vc-brown-dark">购物清单</h1>
          {weekStart && (
            <p className="text-[0.7rem] text-vc-brown-light">本周食谱所需食材</p>
          )}
        </div>
        {totalCount > 0 && (
          <span className="text-[0.78rem] font-medium text-vc-terracotta">
            {checkedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="mx-5 mb-4 h-1.5 bg-vc-cream-deep rounded-full overflow-hidden">
          <div
            className="h-full bg-vc-forest rounded-full transition-all duration-300"
            style={{ width: `${(checkedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="mx-5 bg-white rounded-3xl shadow-[var(--shadow-vc-sm)] p-8 text-center">
          <ShoppingCart size={36} className="mx-auto text-vc-brown-light/30 mb-3" />
          <p className="text-vc-brown-medium text-sm">暂无购物清单</p>
          <p className="text-vc-brown-light text-xs mt-1">请先在食谱页面生成本周食谱</p>
        </div>
      ) : (
        <div className="mx-5 space-y-4">
          {Array.from(grouped.entries()).map(([category, categoryItems]) => (
            <div key={category} className="bg-white rounded-2xl shadow-[var(--shadow-vc-sm)] overflow-hidden">
              <div className="px-4 py-3 bg-vc-cream-deep/50 flex items-center gap-2">
                <span className="text-lg">{CATEGORY_EMOJI[category] ?? "📦"}</span>
                <span className="text-[0.82rem] font-semibold text-vc-brown-dark">{category}</span>
                <span className="text-[0.7rem] text-vc-brown-light ml-auto">
                  {categoryItems.filter((i) => checked.has(i.name)).length}/{categoryItems.length}
                </span>
              </div>
              <div>
                {categoryItems.map((item) => {
                  const isChecked = checked.has(item.name);
                  return (
                    <button
                      key={item.name}
                      onClick={() => toggle(item.name)}
                      className="w-full px-4 py-3 flex items-center gap-3 border-t border-vc-cream-deep/80 active:bg-vc-cream-deep/30 transition-colors"
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                          isChecked
                            ? "bg-vc-forest border-vc-forest"
                            : "border-vc-brown-light/30"
                        }`}
                      >
                        {isChecked && <Check size={12} className="text-white" />}
                      </div>
                      <div className={`flex-1 text-left ${isChecked ? "opacity-40" : ""}`}>
                        <span className={`text-[0.85rem] text-vc-brown-dark ${isChecked ? "line-through" : ""}`}>
                          {item.name}
                        </span>
                        <span className="text-[0.72rem] text-vc-brown-light ml-2">
                          {item.amount}{item.unit}
                        </span>
                      </div>
                      {item.sources.length > 0 && !isChecked && (
                        <span className="text-[0.62rem] text-vc-brown-light/60 max-w-[80px] truncate">
                          {item.sources[0]}{item.sources.length > 1 ? ` +${item.sources.length - 1}` : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
