"use client";

import { Plus, Loader2, Sparkles, Flame, Beef, Wheat, Droplets, BookOpen, ChevronUp, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface MealItem {
  title: string;
  calories: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  portion?: string;
  recipeSteps?: StepData;
}

interface StepData {
  ingredients: { name: string; amount: number; unit: string }[];
  steps: { order: number; text: string; timerSeconds?: number }[];
  cookTime: number;
}

interface DayPlan {
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
}

export interface WeekPlanData {
  plan: Record<string, DayPlan>;
  cheatDays?: number[];
  dailyAverage?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "周一", tue: "周二", wed: "周三", thu: "周四",
  fri: "周五", sat: "周六", sun: "周日",
};

const defaultPlan: WeekPlanData = {
  plan: {
    mon: { breakfast: { title: "燕麦粥", calories: 280, protein: 8, fat: 6, carbs: 48, portion: "燕麦50g + 牛奶200ml" }, lunch: { title: "番茄牛腩", calories: 650, protein: 35, fat: 28, carbs: 55, portion: "米饭150g + 牛腩200g" }, dinner: { title: "清蒸鱼", calories: 420, protein: 38, fat: 12, carbs: 35, portion: "鲈鱼250g + 蔬菜" } },
    tue: { breakfast: { title: "全麦三明治", calories: 320, protein: 15, fat: 10, carbs: 40, portion: "面包2片 + 鸡蛋1个" }, lunch: { title: "宫保鸡丁", calories: 580, protein: 30, fat: 22, carbs: 55, portion: "米饭150g + 鸡丁180g" }, dinner: { title: "蔬菜沙拉", calories: 350, protein: 12, fat: 18, carbs: 30, portion: "混合蔬菜300g" } },
    wed: { breakfast: { title: "牛油果吐司", calories: 360, protein: 10, fat: 20, carbs: 35, portion: "吐司2片 + 半个牛油果" }, lunch: { title: "藜麦沙拉", calories: 450, protein: 18, fat: 15, carbs: 58, portion: "藜麦100g + 鸡胸150g" }, dinner: { title: "三文鱼", calories: 520, protein: 42, fat: 28, carbs: 20, portion: "三文鱼200g + 芦笋" } },
    thu: { breakfast: { title: "酸奶碗", calories: 250, protein: 12, fat: 8, carbs: 32, portion: "酸奶200g + 水果坚果" }, lunch: { title: "炒面", calories: 620, protein: 20, fat: 25, carbs: 72, portion: "面条200g + 蔬菜肉丝" }, dinner: { title: "烤鸡翅", calories: 480, protein: 35, fat: 28, carbs: 15, portion: "鸡翅6个 + 蔬菜" } },
    fri: { breakfast: { title: "蛋饼", calories: 300, protein: 15, fat: 12, carbs: 30, portion: "鸡蛋2个 + 面粉" }, lunch: { title: "麻婆豆腐", calories: 550, protein: 22, fat: 30, carbs: 45, portion: "米饭150g + 豆腐200g" }, dinner: { title: "虾仁粉丝", calories: 400, protein: 28, fat: 8, carbs: 52, portion: "虾仁150g + 粉丝" } },
    sat: { breakfast: { title: "法式吐司", calories: 380, protein: 12, fat: 16, carbs: 45, portion: "厚吐司2片 + 蜂蜜" }, lunch: { title: "红烧排骨", calories: 700, protein: 38, fat: 40, carbs: 35, portion: "排骨250g + 米饭" }, dinner: { title: "冬瓜汤", calories: 280, protein: 15, fat: 8, carbs: 35, portion: "冬瓜200g + 瘦肉" } },
    sun: { breakfast: { title: "小笼包", calories: 420, protein: 18, fat: 16, carbs: 50, portion: "小笼包8个" }, lunch: { title: "糖醋里脊", calories: 600, protein: 30, fat: 25, carbs: 55, portion: "里脊200g + 米饭" }, dinner: { title: "蒸蛋", calories: 220, protein: 16, fat: 14, carbs: 8, portion: "鸡蛋3个 + 虾仁" } },
  },
};

function getTodayKey(): string {
  const d = new Date().getDay();
  return DAY_KEYS[d === 0 ? 6 : d - 1];
}

function getDayCal(plan: Record<string, DayPlan>, key: string): number {
  const day = plan[key];
  if (!day) return 0;
  return day.breakfast.calories + day.lunch.calories + day.dinner.calories;
}

const mealLabels = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" } as const;
const mealEmojis = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" } as const;
const mealColors = {
  breakfast: { bg: "bg-amber-50", accent: "text-amber-600" },
  lunch: { bg: "bg-orange-50", accent: "text-vc-terracotta" },
  dinner: { bg: "bg-emerald-50", accent: "text-vc-forest" },
};

interface Props {
  compact?: boolean;
  targetCalories?: number;
  onNeedBodyProfile?: () => void;
}

export default function WeekView({ compact = true, targetCalories = 1800, onNeedBodyProfile }: Props) {
  const [weekData, setWeekData] = useState<WeekPlanData>(defaultPlan);
  const [loading, setLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(getTodayKey());
  const todayKey = getTodayKey();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [expandedRecipe, setExpandedRecipe] = useState<Record<string, boolean>>({});
  const [recipeSteps, setRecipeSteps] = useState<Record<string, StepData>>({});
  const [loadingRecipe, setLoadingRecipe] = useState<Record<string, boolean>>({});
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mealplan")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.plan) {
          setWeekData({ plan: data.plan, dailyAverage: data.dailyAverage, cheatDays: data.cheatDays ?? [] });
          setIsGenerated(true);
          // Restore cached recipe steps from plan
          const cached: Record<string, StepData> = {};
          for (const day of DAY_KEYS) {
            const dayPlan = data.plan[day];
            if (!dayPlan) continue;
            for (const mt of ["breakfast", "lunch", "dinner"] as const) {
              if (dayPlan[mt]?.recipeSteps) {
                cached[`${day}-${mt}`] = dayPlan[mt].recipeSteps;
              }
            }
          }
          if (Object.keys(cached).length > 0) setRecipeSteps(cached);
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (onNeedBodyProfile) {
      onNeedBodyProfile();
      return;
    }
    setLoading(true);
    setGenError(null);
    try {
      const res = await fetch("/api/mealplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCalories }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWeekData(data);
      setIsGenerated(true);
    } catch (e) {
      console.error("Meal plan generation failed:", e);
      setGenError(e instanceof Error ? e.message : "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRecipe = async (day: string, mealType: string, meal: MealItem) => {
    const key = `${day}-${mealType}`;
    if (recipeSteps[key]) {
      setExpandedRecipe((prev) => ({ ...prev, [key]: !prev[key] }));
      return;
    }
    setLoadingRecipe((prev) => ({ ...prev, [key]: true }));
    setExpandedRecipe((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/recipes/generate-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: meal.title, portion: meal.portion }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecipeSteps((prev) => ({ ...prev, [key]: data }));
        // Persist steps to mealplan
        fetch("/api/mealplan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day,
            mealType,
            meal: { ...meal, recipeSteps: data },
          }),
        }).catch(() => {});
      }
    } catch (e) {
      console.error("Generate steps failed:", e);
      setExpandedRecipe((prev) => ({ ...prev, [key]: false }));
    } finally {
      setLoadingRecipe((prev) => ({ ...prev, [key]: false }));
    }
  };

  const selectedDayPlan = weekData.plan[selectedDay];
  const cheatDaySet = new Set(weekData.cheatDays ?? []);
  const isCheatDay = (key: string) => cheatDaySet.has(DAY_KEYS.indexOf(key as typeof DAY_KEYS[number]) + 1);
  const selectedIsCheat = isCheatDay(selectedDay);
  const totalCal = selectedDayPlan
    ? selectedDayPlan.breakfast.calories + selectedDayPlan.lunch.calories + selectedDayPlan.dinner.calories
    : 0;
  const totalProtein = selectedDayPlan
    ? (selectedDayPlan.breakfast.protein ?? 0) + (selectedDayPlan.lunch.protein ?? 0) + (selectedDayPlan.dinner.protein ?? 0)
    : 0;
  const totalFat = selectedDayPlan
    ? (selectedDayPlan.breakfast.fat ?? 0) + (selectedDayPlan.lunch.fat ?? 0) + (selectedDayPlan.dinner.fat ?? 0)
    : 0;
  const totalCarbs = selectedDayPlan
    ? (selectedDayPlan.breakfast.carbs ?? 0) + (selectedDayPlan.lunch.carbs ?? 0) + (selectedDayPlan.dinner.carbs ?? 0)
    : 0;

  return (
    <div>
      {/* AI generated badge */}
      {isGenerated && (
        <div className="flex items-center gap-1.5 px-5 mb-3">
          <Sparkles size={14} className="text-vc-amber" />
          <span className="text-[0.75rem] text-vc-brown-light">
            AI 已根据你的偏好生成
            {weekData.dailyAverage && ` · 日均 ${weekData.dailyAverage.calories} kcal`}
          </span>
        </div>
      )}

      {/* Week strip */}
      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {DAY_KEYS.map((key) => {
            const day = weekData.plan[key];
            if (!day) return null;
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            const dayCal = getDayCal(weekData.plan, key);
            const isCheat = isCheatDay(key);

            return (
              <button
                key={key}
                ref={(el) => { tabRefs.current[key] = el; }}
                onClick={() => setSelectedDay(key)}
                className={`shrink-0 ${compact ? "w-[60px]" : "w-[68px]"} rounded-2xl py-2.5 px-2 text-center transition-all relative ${
                  isSelected
                    ? isCheat
                      ? "bg-gradient-to-b from-[#D4A373] to-[#B07D4F] text-white shadow-[0_4px_14px_rgba(212,163,115,0.3)] scale-105 z-10"
                      : "bg-gradient-to-b from-[#2D6A4F] to-[#1B4332] text-white shadow-[0_4px_14px_rgba(45,106,79,0.3)] scale-105 z-10"
                    : "bg-white shadow-[var(--shadow-vc-sm)]"
                }`}
              >
                {isCheat && (
                  <span className={`absolute -top-1.5 -right-1 text-[0.6rem] ${isSelected ? "" : ""}`}>🎉</span>
                )}
                <div className={`text-[0.6rem] font-semibold uppercase tracking-wider ${isSelected ? "opacity-80" : "opacity-40"}`}>
                  {key.toUpperCase()}
                </div>
                <div className={`font-serif text-[0.85rem] mt-0.5 ${!isSelected && "text-vc-brown-dark"}`}>
                  {isToday ? "今天" : DAY_LABELS[key]?.slice(1)}
                </div>
                <div className={`flex items-center justify-center gap-0.5 mt-1 ${isSelected ? "text-orange-200" : "text-vc-brown-light"}`}>
                  <Flame size={10} />
                  <span className="text-[0.6rem] font-medium">{dayCal}</span>
                </div>
              </button>
            );
          })}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="shrink-0 w-[68px] rounded-2xl py-2.5 px-2 border-2 border-dashed border-vc-terracotta/30 bg-vc-terracotta/3 flex flex-col items-center justify-center gap-1 active:bg-vc-terracotta/8 transition-all disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="text-vc-terracotta animate-spin" />
            ) : (
              <Plus size={18} className="text-vc-terracotta" />
            )}
            <span className="text-[0.6rem] font-semibold text-vc-terracotta">
              {loading ? "..." : "生成"}
            </span>
          </button>
        </div>
      </div>

      {/* Generation error */}
      {genError && (
        <div className="mx-5 mt-2 bg-red-50 rounded-2xl px-4 py-3 text-[0.8rem] text-red-600">
          {genError}
        </div>
      )}

      {/* Day detail section (full page mode) */}
      {selectedDayPlan && !compact && (
        <div className="px-5 mt-3">
          {/* Nutrition summary — macros only, no calories (calories shown in day tabs) */}
          <div className="bg-[#1B4332] rounded-2xl px-5 py-3.5 text-white">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Beef size={12} className="text-blue-300" />
                  <span className="text-[0.68rem] opacity-70">蛋白质</span>
                </div>
                <span className="text-[0.95rem] font-bold">{totalProtein}g</span>
              </div>
              <div className="w-px h-8 bg-white/15" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Droplets size={12} className="text-amber-300" />
                  <span className="text-[0.68rem] opacity-70">脂肪</span>
                </div>
                <span className="text-[0.95rem] font-bold">{totalFat}g</span>
              </div>
              <div className="w-px h-8 bg-white/15" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Wheat size={12} className="text-green-300" />
                  <span className="text-[0.68rem] opacity-70">碳水</span>
                </div>
                <span className="text-[0.95rem] font-bold">{totalCarbs}g</span>
              </div>
            </div>
          </div>

          {/* Meal cards */}
          <div className="space-y-3 mt-3">
            {selectedIsCheat && (
              <div className="flex items-center gap-2 bg-amber-50 rounded-2xl px-4 py-2.5">
                <span className="text-lg">🎉</span>
                <div>
                  <span className="text-[0.78rem] font-semibold text-amber-700">放纵日</span>
                  <span className="text-[0.72rem] text-amber-600 ml-1.5">今天可以适当放松，享受美食！</span>
                </div>
              </div>
            )}
            {(["breakfast", "lunch", "dinner"] as const).map((mealType) => {
              const meal = selectedDayPlan[mealType];
              const colors = mealColors[mealType];
              const calPercent = totalCal > 0 ? Math.round((meal.calories / totalCal) * 100) : 0;
              const recipeKey = `${selectedDay}-${mealType}`;
              const isExpanded = expandedRecipe[recipeKey];
              const steps = recipeSteps[recipeKey];
              const isLoadingSteps = loadingRecipe[recipeKey];

              return (
                <div key={mealType} className={`${colors.bg} rounded-2xl p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{mealEmojis[mealType]}</span>
                      <span className={`text-[0.78rem] font-semibold ${colors.accent}`}>{mealLabels[mealType]}</span>
                      <span className="text-[0.68rem] text-vc-brown-light">{calPercent}%</span>
                    </div>
                    <button
                      onClick={() => handleToggleRecipe(selectedDay, mealType, meal)}
                      disabled={isLoadingSteps}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.7rem] font-medium transition-all active:scale-95 ${
                        isExpanded
                          ? "bg-vc-brown-dark text-white"
                          : "bg-white/70 text-vc-brown-medium"
                      }`}
                    >
                      {isLoadingSteps ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : isExpanded ? (
                        <ChevronUp size={12} />
                      ) : (
                        <BookOpen size={12} />
                      )}
                      {isLoadingSteps ? "生成中" : isExpanded ? "收起" : "做法"}
                    </button>
                  </div>

                  <h4 className="font-serif text-[1.05rem] text-vc-brown-dark mb-1">{meal.title}</h4>

                  {meal.portion && (
                    <p className="text-[0.78rem] text-vc-brown-medium mb-2.5">📦 {meal.portion}</p>
                  )}

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Flame size={12} className={colors.accent} />
                      <span className="text-[0.75rem] font-semibold text-vc-brown-dark">{meal.calories} kcal</span>
                    </div>
                    {meal.protein != null && (
                      <span className="text-[0.7rem] text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded font-medium">P {meal.protein}g</span>
                    )}
                    {meal.fat != null && (
                      <span className="text-[0.7rem] text-amber-600 bg-amber-100/60 px-1.5 py-0.5 rounded font-medium">F {meal.fat}g</span>
                    )}
                    {meal.carbs != null && (
                      <span className="text-[0.7rem] text-green-600 bg-green-100/60 px-1.5 py-0.5 rounded font-medium">C {meal.carbs}g</span>
                    )}
                  </div>

                  {/* Expanded recipe steps */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-black/5">
                      {isLoadingSteps && !steps && (
                        <div className="flex items-center justify-center gap-2 py-4">
                          <Loader2 size={16} className="animate-spin text-vc-brown-light" />
                          <span className="text-[0.78rem] text-vc-brown-light">AI 正在生成做法...</span>
                        </div>
                      )}
                      {steps && (
                        <div className="space-y-3">
                          {/* Cook time */}
                          <div className="flex items-center gap-1.5 text-[0.72rem] text-vc-brown-light">
                            <Clock size={12} />
                            <span>约 {steps.cookTime} 分钟</span>
                          </div>

                          {/* Ingredients */}
                          <div>
                            <h5 className="text-[0.75rem] font-semibold text-vc-brown-dark mb-1.5">食材</h5>
                            <div className="flex flex-wrap gap-1.5">
                              {steps.ingredients.map((ing, i) => (
                                <span key={i} className="text-[0.7rem] text-vc-brown-medium bg-white/60 px-2 py-1 rounded-lg">
                                  {ing.name} {ing.amount}{ing.unit}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Steps */}
                          <div>
                            <h5 className="text-[0.75rem] font-semibold text-vc-brown-dark mb-1.5">步骤</h5>
                            <div className="space-y-2">
                              {steps.steps.map((step) => (
                                <div key={step.order} className="flex gap-2.5">
                                  <div className={`w-5 h-5 rounded-full ${colors.accent} bg-white flex items-center justify-center text-[0.65rem] font-bold shrink-0 mt-0.5`}>
                                    {step.order}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[0.78rem] text-vc-brown-medium leading-relaxed">{step.text}</p>
                                    {step.timerSeconds != null && step.timerSeconds > 0 && (
                                      <span className="inline-flex items-center gap-1 mt-1 text-[0.68rem] text-vc-forest font-medium bg-white/60 px-1.5 py-0.5 rounded">
                                        <Clock size={10} />
                                        {step.timerSeconds >= 60
                                          ? `${Math.floor(step.timerSeconds / 60)}分${step.timerSeconds % 60 ? `${step.timerSeconds % 60}秒` : ""}`
                                          : `${step.timerSeconds}秒`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact mode: simple list for homepage */}
      {selectedDayPlan && compact && (
        <div className="px-5 mt-2">
          <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-vc-sm)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.78rem] font-semibold text-vc-brown-dark">
                {selectedDay === todayKey ? "今天" : DAY_LABELS[selectedDay]}
              </span>
              <span className="text-[0.72rem] text-vc-brown-light">{totalCal} kcal</span>
            </div>
            {(["breakfast", "lunch", "dinner"] as const).map((mealType) => {
              const meal = selectedDayPlan[mealType];
              return (
                <div key={mealType} className="flex items-center justify-between py-2 border-t border-vc-cream-deep/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{mealEmojis[mealType]}</span>
                    <span className="text-[0.82rem] text-vc-brown-dark">{meal.title}</span>
                  </div>
                  <span className="text-[0.72rem] text-vc-brown-light">{meal.calories} kcal</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
