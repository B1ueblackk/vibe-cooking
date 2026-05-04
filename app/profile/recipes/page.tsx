"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Flame, Heart, Trash2 } from "lucide-react";
import type { Recipe } from "@/lib/types";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "简单", medium: "中等", hard: "困难",
};

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 140; // total width of revealed buttons

function SwipeableCard({
  recipe,
  openId,
  isFavorited,
  onOpen,
  onTap,
  onFavorite,
  onDelete,
}: {
  recipe: Recipe;
  openId: string | null;
  isFavorited: boolean;
  onOpen: (id: string | null) => void;
  onTap: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpen = openId === recipe.id;

  const setTranslate = useCallback((x: number) => {
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${x}px)`;
    }
  }, []);

  // Close when another card opens
  useEffect(() => {
    if (openId !== recipe.id && containerRef.current) {
      containerRef.current.style.transition = "transform 0.3s ease";
      setTranslate(0);
      const t = setTimeout(() => {
        if (containerRef.current) containerRef.current.style.transition = "";
      }, 300);
      return () => clearTimeout(t);
    }
  }, [openId, recipe.id, setTranslate]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = isOpen ? -ACTION_WIDTH : 0;
    swiping.current = false;
    if (containerRef.current) containerRef.current.style.transition = "";
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const newX = Math.max(-ACTION_WIDTH, Math.min(0, currentX.current + dx));
    if (Math.abs(dx) > 8) swiping.current = true;
    setTranslate(newX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (containerRef.current) containerRef.current.style.transition = "transform 0.3s ease";

    if (isOpen) {
      // Already open: close if swiped right enough
      if (dx > SWIPE_THRESHOLD) {
        setTranslate(0);
        onOpen(null);
      } else {
        setTranslate(-ACTION_WIDTH);
      }
    } else {
      // Closed: open if swiped left enough
      if (dx < -SWIPE_THRESHOLD) {
        setTranslate(-ACTION_WIDTH);
        onOpen(recipe.id);
      } else {
        setTranslate(0);
      }
    }

    setTimeout(() => {
      if (containerRef.current) containerRef.current.style.transition = "";
    }, 300);

    // Tap (no significant swipe)
    if (!swiping.current) {
      if (isOpen) {
        setTranslate(0);
        onOpen(null);
      } else {
        onTap();
      }
    }
  };

  return (
    <div className="relative rounded-2xl shadow-[var(--shadow-vc-sm)] overflow-hidden">
      {/* Action buttons behind the card */}
      <div className="absolute inset-y-0 right-0 flex">
        <button
          onClick={onFavorite}
          className={`w-[70px] flex flex-col items-center justify-center gap-1 text-white active:brightness-90 transition-all ${
            isFavorited ? "bg-vc-brown-light" : "bg-vc-amber"
          }`}
        >
          <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
          <span className="text-[0.68rem] font-medium">{isFavorited ? "取消收藏" : "收藏"}</span>
        </button>
        <button
          onClick={onDelete}
          className="w-[70px] flex flex-col items-center justify-center gap-1 bg-red-500 text-white active:brightness-90 transition-all"
        >
          <Trash2 size={18} />
          <span className="text-[0.68rem] font-medium">删除</span>
        </button>
      </div>

      {/* Foreground card */}
      <div
        ref={containerRef}
        className="relative bg-white will-change-transform"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-vc-terracotta/20 to-vc-amber/20 flex items-center justify-center text-2xl shrink-0">
              🍳
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[0.92rem] font-semibold text-vc-brown-dark truncate">
                {recipe.title}
              </h3>
              <p className="text-xs text-vc-brown-light mt-0.5 line-clamp-1">
                {recipe.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[0.7rem] text-vc-brown-light">
                  <Flame size={12} className="text-vc-terracotta" />
                  {recipe.calories} kcal
                </span>
                <span className="flex items-center gap-1 text-[0.7rem] text-vc-brown-light">
                  <Clock size={12} />
                  {recipe.cookTime} 分钟
                </span>
                <span className="text-[0.65rem] px-1.5 py-0.5 rounded-md bg-vc-cream-deep text-vc-brown-medium">
                  {DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty}
                </span>
                {recipe.isAiGenerated && (
                  <span className="text-[0.65rem] px-1.5 py-0.5 rounded-md bg-vc-forest/10 text-vc-forest">
                    AI
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyRecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"all" | "ai" | "original">("all");

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecipes(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/profile/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFavSet(new Set(data.map((r: { id: string }) => r.id)));
      })
      .catch(() => {});
  }, []);

  const filteredRecipes = recipes.filter((r) => {
    if (tab === "ai") return r.isAiGenerated;
    if (tab === "original") return !r.isAiGenerated;
    return true;
  });

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      }
    } catch { /* ignore */ }
    setDeleting(false);
    setDeleteId(null);
    setOpenSwipeId(null);
  };

  const handleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}/favorite`, { method: "POST" });
      const data = await res.json();
      setFavSet((prev) => {
        const next = new Set(prev);
        if (data.saved) next.add(id); else next.delete(id);
        return next;
      });
    } catch { /* ignore */ }
    setOpenSwipeId(null);
  };

  return (
    <div className="pt-14 pb-24">
      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-3xl p-6 mx-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-serif text-lg text-vc-brown-dark mb-2">确认删除</h3>
            <p className="text-sm text-vc-brown-medium mb-5">删除后无法恢复，确定要删除吗？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-vc-cream-deep text-vc-brown-medium text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 mb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-vc-brown-dark" />
        </button>
        <h1 className="font-serif text-xl text-vc-brown-dark">我的菜谱</h1>
        <span className="text-sm text-vc-brown-light ml-auto">{filteredRecipes.length} 个</span>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4 flex gap-2">
        {([
          { key: "all", label: "全部" },
          { key: "ai", label: "AI 生成" },
          { key: "original", label: "原创" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-[0.78rem] font-medium transition-all ${
              tab === t.key
                ? "bg-vc-terracotta text-white shadow-sm"
                : "bg-vc-cream-deep text-vc-brown-medium active:bg-vc-cream-deep/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="mx-5 bg-white rounded-3xl shadow-[var(--shadow-vc-sm)] p-8 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-vc-brown-medium text-sm">还没有创建菜谱</p>
          <p className="text-vc-brown-light text-xs mt-1">在首页输入食材，让 AI 帮你生成</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="mx-5 bg-white rounded-3xl shadow-[var(--shadow-vc-sm)] p-8 text-center">
          <div className="text-4xl mb-3">{tab === "ai" ? "🤖" : "📝"}</div>
          <p className="text-vc-brown-medium text-sm">
            {tab === "ai" ? "暂无 AI 生成的菜谱" : "暂无原创菜谱"}
          </p>
        </div>
      ) : (
        <div className="mx-5 space-y-3">
          {filteredRecipes.map((recipe) => (
            <SwipeableCard
              key={recipe.id}
              recipe={recipe}
              openId={openSwipeId}
              isFavorited={favSet.has(recipe.id)}
              onOpen={setOpenSwipeId}
              onTap={() => router.push(`/recipes/${recipe.id}`)}
              onFavorite={() => handleFavorite(recipe.id)}
              onDelete={() => setDeleteId(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
