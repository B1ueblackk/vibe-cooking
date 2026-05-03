"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Flame } from "lucide-react";
import type { Recipe } from "@/lib/types";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "简单", medium: "中等", hard: "困难",
};

export default function MyRecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecipes(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-14 pb-24">
      {/* Header */}
      <div className="px-5 mb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-vc-brown-dark" />
        </button>
        <h1 className="font-serif text-xl text-vc-brown-dark">我的菜谱</h1>
        <span className="text-sm text-vc-brown-light ml-auto">{recipes.length} 个</span>
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
      ) : (
        <div className="mx-5 space-y-3">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => router.push(`/recipes/${recipe.id}`)}
              className="w-full bg-white rounded-2xl shadow-[var(--shadow-vc-sm)] p-4 text-left active:scale-[0.98] transition-transform"
            >
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
