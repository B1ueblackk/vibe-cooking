"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, ChevronDown, ChevronUp, Sparkles, Loader2, Star, TrendingUp, AlertTriangle } from "lucide-react";

interface MealItem {
  title: string;
  calories: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  portion?: string;
}

interface DayPlan {
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
}

interface PlanRow {
  id: string;
  weekStart: string;
  plan: Record<string, DayPlan>;
  targetCalories: number;
  cheatDays?: number[];
  createdAt: string;
}

interface Analysis {
  score: number;
  highlights: string[];
  improvements: string[];
  macroBalance: string;
  summary: string;
}

const DAY_LABELS: Record<string, string> = {
  mon: "周一", tue: "周二", wed: "周三", thu: "周四",
  fri: "周五", sat: "周六", sun: "周日",
};
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const MEAL_LABELS: Record<string, string> = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" };

function weekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return `${d.getMonth() + 1}/${d.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
}

function weekTotals(plan: Record<string, DayPlan>) {
  let cal = 0, p = 0, f = 0, c = 0, meals = 0;
  for (const day of Object.values(plan)) {
    for (const meal of [day.breakfast, day.lunch, day.dinner]) {
      if (meal?.title) {
        cal += meal.calories ?? 0;
        p += meal.protein ?? 0;
        f += meal.fat ?? 0;
        c += meal.carbs ?? 0;
        meals++;
      }
    }
  }
  return { cal, p, f, c, meals, avgCal: meals > 0 ? Math.round(cal / 7) : 0 };
}

export default function DietReportPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({});
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/mealplan/history")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyze = async (planId: string) => {
    if (analyses[planId] || analyzing[planId]) return;
    setAnalyzing((prev) => ({ ...prev, [planId]: true }));
    try {
      const res = await fetch("/api/mealplan/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnalyses((prev) => ({ ...prev, [planId]: data }));
      }
    } catch {
      // ignore
    } finally {
      setAnalyzing((prev) => ({ ...prev, [planId]: false }));
    }
  };

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
        <h1 className="font-serif text-xl text-vc-brown-dark">饮食报告</h1>
        <span className="text-sm text-vc-brown-light ml-auto">{plans.length} 周记录</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="mx-5 bg-white rounded-3xl shadow-[var(--shadow-vc-sm)] p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-vc-brown-medium text-sm">还没有饮食记录</p>
          <p className="text-vc-brown-light text-xs mt-1">在食谱页面生成本周食谱后会自动记录</p>
        </div>
      ) : (
        <div className="mx-5 space-y-4">
          {plans.map((plan) => {
            const totals = weekTotals(plan.plan);
            const isExpanded = expandedWeek === plan.id;
            const analysis = analyses[plan.id];
            const isAnalyzing = analyzing[plan.id];

            return (
              <div key={plan.id} className="bg-white rounded-3xl shadow-[var(--shadow-vc-sm)] overflow-hidden">
                {/* Week header — always visible */}
                <button
                  onClick={() => setExpandedWeek(isExpanded ? null : plan.id)}
                  className="w-full px-5 py-4 flex items-center gap-3 active:bg-vc-cream-deep/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vc-forest/15 to-vc-amber/15 flex items-center justify-center text-lg">
                    📋
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[0.88rem] font-semibold text-vc-brown-dark">
                      {weekLabel(plan.weekStart)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-[0.72rem] text-vc-brown-light">
                        <Flame size={11} className="text-vc-terracotta" />
                        日均 {totals.avgCal} kcal
                      </span>
                      <span className="text-[0.68rem] text-vc-brown-light">
                        · {totals.meals} 餐
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-vc-brown-light" />
                  ) : (
                    <ChevronDown size={16} className="text-vc-brown-light" />
                  )}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5">
                    {/* Weekly summary bar */}
                    <div className="bg-vc-cream-deep rounded-2xl px-4 py-3 mb-3 flex items-center justify-around text-center">
                      <div>
                        <div className="text-[0.68rem] text-vc-brown-light">总热量</div>
                        <div className="text-[0.85rem] font-bold text-vc-brown-dark">{totals.cal}</div>
                      </div>
                      <div className="w-px h-8 bg-vc-brown-light/15" />
                      <div>
                        <div className="text-[0.68rem] text-vc-brown-light">蛋白质</div>
                        <div className="text-[0.85rem] font-bold text-blue-600">{totals.p}g</div>
                      </div>
                      <div className="w-px h-8 bg-vc-brown-light/15" />
                      <div>
                        <div className="text-[0.68rem] text-vc-brown-light">脂肪</div>
                        <div className="text-[0.85rem] font-bold text-amber-600">{totals.f}g</div>
                      </div>
                      <div className="w-px h-8 bg-vc-brown-light/15" />
                      <div>
                        <div className="text-[0.68rem] text-vc-brown-light">碳水</div>
                        <div className="text-[0.85rem] font-bold text-green-600">{totals.c}g</div>
                      </div>
                    </div>

                    {/* Day-by-day meals */}
                    <div className="space-y-2 mb-4">
                      {DAY_KEYS.map((dayKey) => {
                        const day = plan.plan[dayKey];
                        if (!day) return null;
                        const dayCal = (day.breakfast?.calories ?? 0) + (day.lunch?.calories ?? 0) + (day.dinner?.calories ?? 0);
                        const cheatDaySet = new Set(plan.cheatDays ?? []);
                        const isCheat = cheatDaySet.has(DAY_KEYS.indexOf(dayKey) + 1);

                        return (
                          <div key={dayKey} className={`rounded-xl px-3.5 py-2.5 ${isCheat ? "bg-amber-50" : "bg-vc-cream-deep/50"}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[0.78rem] font-semibold text-vc-brown-dark">
                                {DAY_LABELS[dayKey]}
                                {isCheat && <span className="ml-1 text-[0.65rem] text-amber-600">🎉 放纵日</span>}
                              </span>
                              <span className="text-[0.7rem] text-vc-brown-light">{dayCal} kcal</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {(["breakfast", "lunch", "dinner"] as const).map((mt) => {
                                const meal = day[mt];
                                if (!meal?.title) return null;
                                return (
                                  <span key={mt} className="text-[0.72rem] text-vc-brown-medium">
                                    {MEAL_LABELS[mt]}：{meal.title}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Analysis */}
                    {analysis ? (
                      <div className="bg-gradient-to-br from-vc-forest/5 to-vc-amber/5 rounded-2xl p-4">
                        {/* Score */}
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles size={16} className="text-vc-amber" />
                          <span className="text-[0.82rem] font-semibold text-vc-brown-dark">AI 分析</span>
                          <span className="ml-auto flex items-center gap-1 text-[0.82rem] font-bold text-vc-amber-warm">
                            <Star size={14} className="fill-vc-amber text-vc-amber" />
                            {analysis.score}/10
                          </span>
                        </div>

                        {/* Summary */}
                        <p className="text-[0.78rem] text-vc-brown-dark mb-3 leading-relaxed">
                          {analysis.summary}
                        </p>

                        {/* Macro balance */}
                        <p className="text-[0.72rem] text-vc-brown-medium mb-3 bg-white/50 rounded-lg px-3 py-2">
                          ⚖️ {analysis.macroBalance}
                        </p>

                        {/* Highlights */}
                        <div className="mb-2">
                          <div className="flex items-center gap-1 mb-1.5">
                            <TrendingUp size={13} className="text-vc-forest" />
                            <span className="text-[0.72rem] font-semibold text-vc-forest">做得好</span>
                          </div>
                          {analysis.highlights.map((h, i) => (
                            <p key={i} className="text-[0.72rem] text-vc-brown-medium ml-5 mb-1 leading-relaxed">• {h}</p>
                          ))}
                        </div>

                        {/* Improvements */}
                        <div>
                          <div className="flex items-center gap-1 mb-1.5">
                            <AlertTriangle size={13} className="text-amber-500" />
                            <span className="text-[0.72rem] font-semibold text-amber-600">可改进</span>
                          </div>
                          {analysis.improvements.map((imp, i) => (
                            <p key={i} className="text-[0.72rem] text-vc-brown-medium ml-5 mb-1 leading-relaxed">• {imp}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAnalyze(plan.id)}
                        disabled={isAnalyzing}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-vc-forest to-vc-forest/80 text-white text-[0.85rem] font-medium flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-60 transition-all"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            AI 分析中...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            AI 分析本周饮食
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
