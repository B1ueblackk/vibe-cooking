"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, ChefHat, Sparkles, Bookmark, Check, Share2 } from "lucide-react";
import { MACRO_COLORS, DAILY_REFERENCE, DIFFICULTY_LABELS } from "@/lib/constants";
import type { Recipe } from "@/lib/types";

interface RecipeDetail extends Recipe {
  author?: { nickname: string; avatarUrl?: string };
  isSaved?: boolean;
}

const visualMap: Record<string, { emoji: string; gradient: string }> = {
  "番茄罗勒意面": { emoji: "🍝", gradient: "from-orange-100 to-orange-200" },
  "牛油果鸡肉碗": { emoji: "🥑", gradient: "from-green-100 to-green-200" },
  "韩式泡菜豆腐锅": { emoji: "🍲", gradient: "from-amber-100 to-amber-200" },
  "地中海风味沙拉": { emoji: "🥗", gradient: "from-lime-100 to-green-100" },
  "酸辣粉": { emoji: "🍜", gradient: "from-red-100 to-orange-100" },
};
const defaultVisual = { emoji: "🍽️", gradient: "from-gray-100 to-gray-200" };

function MacroCircle({ percent, color, icon }: { percent: number; color: string; icon: string }) {
  const r = 15.5;
  const circumference = 2 * Math.PI * r;
  const dashArray = `${(percent / 100) * circumference}, ${circumference}`;

  return (
    <div className="relative w-[42px] h-[42px] mx-auto mb-2">
      <svg viewBox="0 0 36 36" className="-rotate-90 w-full h-full">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3.5" />
        <circle
          cx="18" cy="18" r={r}
          fill="none" stroke={color} strokeWidth="3.5"
          strokeLinecap="round" strokeDasharray={dashArray}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-bold text-vc-brown-dark">
        {icon}
      </span>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds >= 60) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec ? `${min}分${sec}秒` : `${min}分钟`;
  }
  return `${seconds}秒`;
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data: RecipeDetail) => {
        setRecipe(data);
        setSaved(data.isSaved ?? false);
      })
      .catch(() => setError("菜谱未找到"))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSave = async () => {
    setSaved(!saved);
    try {
      await fetch(`/api/recipes/${id}/favorite`, { method: "POST" });
    } catch {
      setSaved(saved);
    }
  };

  if (loading) {
    return (
      <div className="pt-14 px-5">
        <div className="h-56 bg-vc-cream-deep rounded-3xl animate-pulse mb-4" />
        <div className="h-6 w-1/2 bg-vc-cream-deep rounded animate-pulse mb-2" />
        <div className="h-4 w-3/4 bg-vc-cream-deep rounded animate-pulse" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="pt-14 px-5 text-center">
        <p className="text-vc-brown-light text-lg mt-20">{error ?? "加载失败"}</p>
        <button onClick={() => router.back()} className="mt-4 text-vc-terracotta font-medium">
          返回
        </button>
      </div>
    );
  }

  const visual = visualMap[recipe.title] || defaultVisual;
  const macros = [
    { label: "热量", value: `${recipe.calories} kcal`, percent: Math.min((recipe.calories / DAILY_REFERENCE.calories) * 100, 100), icon: "🔥", color: MACRO_COLORS.calories, bg: "#FFF3ED" },
    { label: "蛋白质", value: `${recipe.protein}g`, percent: Math.min((recipe.protein / DAILY_REFERENCE.protein) * 100, 100), icon: "P", color: MACRO_COLORS.protein, bg: "#EDF6FF" },
    { label: "脂肪", value: `${recipe.fat}g`, percent: Math.min((recipe.fat / DAILY_REFERENCE.fat) * 100, 100), icon: "F", color: MACRO_COLORS.fat, bg: "#FFF9E6" },
    { label: "碳水", value: `${recipe.carbs}g`, percent: Math.min((recipe.carbs / DAILY_REFERENCE.carbs) * 100, 100), icon: "C", color: MACRO_COLORS.carbs, bg: "#EDFFEF" },
  ];

  return (
    <div className="pb-24">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-12 pb-3 bg-gradient-to-b from-white/90 to-white/0 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-vc-brown-dark" />
        </button>
        <button
          onClick={toggleSave}
          className={`w-10 h-10 rounded-full shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-all ${
            saved ? "bg-vc-amber text-white" : "bg-white/80 text-vc-brown-light"
          }`}
        >
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Cover */}
      <div className={`h-64 bg-gradient-to-br ${visual.gradient} flex items-center justify-center`}>
        <span className="text-8xl">{visual.emoji}</span>
      </div>

      {/* Content */}
      <div className="px-5 -mt-6 relative">
        {/* Title card */}
        <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)]">
          <h1 className="font-serif text-2xl text-vc-brown-dark mb-1.5">{recipe.title}</h1>
          <p className="text-[0.88rem] text-vc-brown-light leading-relaxed mb-3">{recipe.description}</p>

          <div className="flex items-center gap-3 text-[0.78rem] text-vc-brown-medium">
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-vc-terracotta" />
              {recipe.cookTime}分钟
            </span>
            <span className="flex items-center gap-1">
              <ChefHat size={14} className="text-vc-terracotta" />
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </span>
            {recipe.isAiGenerated && (
              <span className="flex items-center gap-1 text-vc-forest">
                <Sparkles size={14} />
                AI 生成
              </span>
            )}
          </div>

          {/* Author */}
          {recipe.author && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-vc-cream-deep">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-amber-warm flex items-center justify-center text-xs text-white font-medium">
                {recipe.author.nickname[0]}
              </div>
              <span className="text-[0.78rem] text-vc-brown-medium">{recipe.author.nickname}</span>
            </div>
          )}
        </div>

        {/* Nutrition */}
        <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)] mt-3">
          <h2 className="font-serif text-[1.05rem] text-vc-brown-dark mb-3">营养成分</h2>
          <div className="grid grid-cols-4 gap-2.5">
            {macros.map((m) => (
              <div key={m.label} className="text-center py-3.5 px-2 rounded-xl" style={{ background: m.bg }}>
                <MacroCircle percent={m.percent} color={m.color} icon={m.icon} />
                <div className="text-[0.7rem] text-vc-brown-light font-medium">{m.label}</div>
                <div className="text-[0.82rem] font-semibold text-vc-brown-dark mt-0.5">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)] mt-3">
          <h2 className="font-serif text-[1.05rem] text-vc-brown-dark mb-3">食材清单</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-2 bg-vc-cream-deep/60 rounded-lg px-3 py-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-vc-terracotta shrink-0" />
                <span className="text-[0.82rem] text-vc-brown-medium">
                  {ing.name} <span className="text-vc-brown-light">{ing.amount}{ing.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)] mt-3">
          <h2 className="font-serif text-[1.05rem] text-vc-brown-dark mb-3">烹饪步骤</h2>
          <div className="space-y-4">
            {recipe.steps.map((step) => (
              <div key={step.order} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-vc-terracotta text-white text-[0.75rem] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.order}
                </div>
                <div className="flex-1">
                  <p className="text-[0.88rem] text-vc-brown-medium leading-relaxed">{step.text}</p>
                  {step.timerSeconds && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[0.75rem] text-vc-forest font-medium bg-vc-forest/8 px-2.5 py-1 rounded-full">
                      <Clock size={12} />
                      {formatTime(step.timerSeconds)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-vc-cream-deep px-5 py-3 flex gap-3 z-50">
        <button
          onClick={toggleSave}
          className={`flex-1 py-3 rounded-2xl font-medium text-[0.88rem] flex items-center justify-center gap-2 transition-all ${
            saved
              ? "bg-vc-forest/10 text-vc-forest"
              : "bg-vc-terracotta text-white active:bg-vc-terracotta/90"
          }`}
        >
          {saved ? <Check size={18} /> : <Bookmark size={18} />}
          {saved ? "已收藏" : "收藏菜谱"}
        </button>
        <button className="w-12 h-12 rounded-2xl bg-vc-cream-deep flex items-center justify-center active:bg-vc-cream-deep/70 transition-colors">
          <Share2 size={20} className="text-vc-brown-medium" />
        </button>
      </div>
    </div>
  );
}
