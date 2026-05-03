"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarSync, Check, Loader2 } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import HeroInput from "@/components/recipe/IngredientInput";
import NutritionPanel from "@/components/recipe/NutritionPanel";
import type { RecipeData } from "@/components/recipe/NutritionPanel";
import TasteProfile from "@/components/profile/TasteProfile";
import WeekView from "@/components/mealplan/WeekView";
import FoodMap from "@/components/map/FoodMap";
import CommunityFeed from "@/components/community/CommunityFeed";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "周一", tue: "周二", wed: "周三", thu: "周四",
  fri: "周五", sat: "周六", sun: "周日",
};
const MEAL_LABELS = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" } as const;

export default function HomePage() {
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [showReplace, setShowReplace] = useState(false);
  const [replaceDay, setReplaceDay] = useState<string>("mon");
  const [replaceMeal, setReplaceMeal] = useState<"breakfast" | "lunch" | "dinner">("lunch");
  const [replacing, setReplacing] = useState(false);
  const [replaceSuccess, setReplaceSuccess] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data?.stats) {
          const { recipeCount = 0, favoriteCount = 0, restaurantCount = 0 } = data.stats;
          setLevel(Math.floor((recipeCount + favoriteCount + restaurantCount) / 5) + 1);
        }
        if (data?.user) {
          setAvatarUrl(data.user.avatarUrl || null);
          setNickname(data.user.nickname || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async (inputIngredients: string[]) => {
    setLoading(true);
    setError(null);
    setSaved(false);
    setSavedRecipeId(null);
    setIngredients(inputIngredients);
    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: inputIngredients }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      setRecipe(data.recipe);
      setShowReplace(false);
      setReplaceSuccess(null);
      // Auto-save to history
      fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data.recipe,
          isAiGenerated: true,
          sourceIngredients: inputIngredients,
        }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((saved) => {
          if (saved?.id) {
            setSaved(true);
            setSavedRecipeId(saved.id);
          }
        })
        .catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!recipe) return;
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...recipe,
          isAiGenerated: true,
          sourceIngredients: ingredients,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        setSavedRecipeId(data.id);
      }
    } catch (e) {
      console.error("Save failed:", e);
    }
  };

  const handleReplaceMeal = async () => {
    if (!recipe) return;
    setReplacing(true);
    setReplaceSuccess(null);
    try {
      const meal = {
        title: recipe.title,
        calories: recipe.calories,
        protein: recipe.protein,
        fat: recipe.fat,
        carbs: recipe.carbs,
        portion: recipe.ingredients.map((i) => `${i.name}${i.amount}${i.unit}`).join(" + "),
        recipeSteps: {
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          cookTime: recipe.cookTime,
        },
      };
      const res = await fetch("/api/mealplan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: replaceDay, mealType: replaceMeal, meal }),
      });
      if (res.ok) {
        setReplaceSuccess(`已替换${DAY_LABELS[replaceDay]}的${MEAL_LABELS[replaceMeal]}`);
        setShowReplace(false);
      }
    } catch (e) {
      console.error("Replace meal failed:", e);
    } finally {
      setReplacing(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="pt-14 px-6">
        <div className="flex justify-between items-start mb-7">
          <div>
            <h1 className="font-serif text-[2rem] text-vc-brown-dark leading-none tracking-tight">
              Vibe <span className="text-vc-terracotta">Cooking</span>
            </h1>
            <p className="text-[0.75rem] text-vc-brown-light font-normal tracking-widest uppercase mt-1">
              Your culinary journey
            </p>
          </div>
          <div
            onClick={() => router.push("/profile")}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-amber-warm flex items-center justify-center text-lg text-white shadow-[var(--shadow-vc-md)] cursor-pointer active:scale-95 transition-transform overflow-hidden"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              nickname[0] || "?"
            )}
          </div>
        </div>
        <p className="font-serif text-[1.65rem] text-vc-brown-dark leading-tight">今天想吃点什么？</p>
        <p className="text-[0.95rem] text-vc-brown-light mt-1">让 AI 帮你发现美味灵感</p>
      </header>

      {/* Hero: Ingredient Input */}
      <HeroInput onGenerate={handleGenerate} loading={loading} />

      {/* Loading indicator */}
      {loading && (
        <div className="mx-5 mt-6 bg-white rounded-3xl p-8 shadow-[var(--shadow-vc-md)] flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-vc-terracotta/10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-vc-brown-light">AI 正在为你设计菜谱...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mt-4 bg-red-50 rounded-2xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* AI Generated Recipe */}
      {recipe && !loading && (
        <>
          <SectionHeader title="AI 为你推荐" />
          <NutritionPanel recipe={recipe} saved={saved} />
          {saved && savedRecipeId && (
            <div className="mx-5 mt-2">
              <button
                onClick={() => router.push(`/recipes/${savedRecipeId}`)}
                className="w-full py-2.5 rounded-xl text-[0.82rem] font-medium text-vc-terracotta bg-vc-terracotta/8 active:bg-vc-terracotta/15 transition-colors"
              >
                查看完整菜谱 →
              </button>
            </div>
          )}

          {/* Replace meal in weekly plan */}
          <div className="mx-5 mt-2">
            {!showReplace && !replaceSuccess && (
              <button
                onClick={() => { setShowReplace(true); setReplaceSuccess(null); }}
                className="w-full py-2.5 rounded-xl text-[0.82rem] font-medium text-vc-forest bg-vc-forest/8 active:bg-vc-forest/15 transition-colors flex items-center justify-center gap-1.5"
              >
                <CalendarSync size={15} />
                替换本周某餐
              </button>
            )}

            {replaceSuccess && (
              <div className="flex items-center justify-center gap-1.5 py-2.5 text-[0.82rem] text-vc-forest font-medium">
                <Check size={15} />
                {replaceSuccess}
              </div>
            )}

            {showReplace && (
              <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-vc-sm)]">
                <p className="text-[0.75rem] text-vc-brown-light mb-2.5">选择要替换的日期和餐次</p>

                {/* Day selector */}
                <div className="flex gap-1.5 mb-2.5">
                  {DAY_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setReplaceDay(key)}
                      className={`flex-1 py-1.5 rounded-lg text-[0.7rem] font-medium transition-all ${
                        replaceDay === key
                          ? "bg-vc-forest text-white"
                          : "bg-vc-cream-deep text-vc-brown-medium"
                      }`}
                    >
                      {DAY_LABELS[key].slice(1)}
                    </button>
                  ))}
                </div>

                {/* Meal type selector */}
                <div className="flex gap-2 mb-3">
                  {(["breakfast", "lunch", "dinner"] as const).map((mt) => (
                    <button
                      key={mt}
                      onClick={() => setReplaceMeal(mt)}
                      className={`flex-1 py-2 rounded-xl text-[0.78rem] font-medium transition-all ${
                        replaceMeal === mt
                          ? "bg-vc-terracotta text-white"
                          : "bg-vc-cream-deep text-vc-brown-medium"
                      }`}
                    >
                      {MEAL_LABELS[mt]}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReplace(false)}
                    className="flex-1 py-2.5 rounded-xl text-[0.82rem] font-medium text-vc-brown-light bg-vc-cream-deep"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReplaceMeal}
                    disabled={replacing}
                    className="flex-1 py-2.5 rounded-xl text-[0.82rem] font-medium text-white bg-vc-forest active:bg-vc-forest/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {replacing ? <Loader2 size={14} className="animate-spin" /> : null}
                    {replacing ? "替换中..." : `替换${DAY_LABELS[replaceDay]}${MEAL_LABELS[replaceMeal]}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Taste Profile */}
      <div className="mt-6" />
      <TasteProfile level={level} />

      {/* Weekly Meal Plan */}
      <SectionHeader title="本周食谱" action="完整计划" href="/mealplan" />
      <WeekView />

      {/* Food Map */}
      <SectionHeader title="美食足迹" action="地图" href="/explore" />
      <FoodMap />

      {/* Community Feed */}
      <SectionHeader title="社区灵感" action="发现更多" href="/community" />
      <CommunityFeed />

      {/* end of content */}
    </>
  );
}
