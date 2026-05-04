"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, Clock } from "lucide-react";

interface RecItem {
  id: string;
  recipeId: string;
  message?: string;
  readAt?: string;
  createdAt: string;
  sender?: { id: string; nickname: string; avatarUrl?: string };
  recipe?: { id: string; title: string; description: string; calories: number; cookTime: number; coverImage?: string };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  return `${Math.floor(hr / 24)}天前`;
}

export default function RecommendationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recipes/recommendations")
      .then((r) => r.json())
      .then((data) => { if (data.items) setItems(data.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClick = async (item: RecItem) => {
    // Mark as read
    if (!item.readAt) {
      fetch("/api/recipes/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      }).catch(() => {});
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i));
    }
    router.push(`/recipes/${item.recipeId}`);
  };

  return (
    <div className="pt-14 pb-24">
      <div className="px-5 mb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-vc-brown-dark" />
        </button>
        <h1 className="font-serif text-xl text-vc-brown-dark">好友推荐</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="mx-5 bg-white rounded-3xl shadow-[var(--shadow-vc-sm)] p-8 text-center">
          <div className="text-4xl mb-3">💌</div>
          <p className="text-vc-brown-medium text-sm">还没有收到推荐</p>
          <p className="text-vc-brown-light text-xs mt-1">好友推荐的菜谱会出现在这里</p>
        </div>
      ) : (
        <div className="mx-5 space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`w-full text-left bg-white rounded-2xl shadow-[var(--shadow-vc-sm)] p-4 active:bg-vc-cream-deep/30 transition-colors ${
                !item.readAt ? "ring-2 ring-vc-terracotta/20" : ""
              }`}
            >
              {/* Sender */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-amber-warm flex items-center justify-center text-[0.55rem] text-white overflow-hidden">
                  {item.sender?.avatarUrl ? (
                    <img src={item.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    item.sender?.nickname?.[0] ?? "?"
                  )}
                </div>
                <span className="text-[0.78rem] font-medium text-vc-brown-dark">{item.sender?.nickname ?? "好友"}</span>
                <span className="text-[0.65rem] text-vc-brown-light">推荐了菜谱</span>
                <span className="text-[0.62rem] text-vc-brown-light/60 ml-auto">{timeAgo(item.createdAt)}</span>
                {!item.readAt && <span className="w-2 h-2 rounded-full bg-vc-terracotta shrink-0" />}
              </div>

              {/* Recipe */}
              {item.recipe && (
                <div className="flex items-start gap-3">
                  {item.recipe.coverImage ? (
                    <img src={item.recipe.coverImage} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-vc-terracotta/20 to-vc-amber/20 flex items-center justify-center text-2xl shrink-0">
                      🍳
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[0.88rem] font-semibold text-vc-brown-dark truncate">{item.recipe.title}</h3>
                    <p className="text-[0.72rem] text-vc-brown-light line-clamp-1 mt-0.5">{item.recipe.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[0.68rem] text-vc-brown-light">
                        <Flame size={11} className="text-vc-terracotta" /> {item.recipe.calories} kcal
                      </span>
                      <span className="flex items-center gap-1 text-[0.68rem] text-vc-brown-light">
                        <Clock size={11} /> {item.recipe.cookTime}分钟
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              {item.message && (
                <p className="mt-2.5 text-[0.78rem] text-vc-brown-medium bg-vc-cream-deep/40 rounded-lg px-3 py-2 italic">
                  &ldquo;{item.message}&rdquo;
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
