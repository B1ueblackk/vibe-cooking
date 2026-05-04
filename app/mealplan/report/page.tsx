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

function CalorieTrendChart({ plan, target }: { plan: Record<string, DayPlan>; target: number }) {
  const dailyCals = DAY_KEYS.map((k) => {
    const d = plan[k];
    return d ? (d.breakfast?.calories ?? 0) + (d.lunch?.calories ?? 0) + (d.dinner?.calories ?? 0) : 0;
  });
  const maxCal = Math.max(...dailyCals, target, 100);
  const W = 280, H = 120, PX = 30, PY = 10;
  const chartW = W - PX * 2, chartH = H - PY * 2;
  const toX = (i: number) => PX + (i / 6) * chartW;
  const toY = (v: number) => PY + chartH - (v / maxCal) * chartH;
  const points = dailyCals.map((c, i) => `${toX(i)},${toY(c)}`).join(" ");
  const targetY = toY(target);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-vc-sm)]">
      <p className="text-[0.75rem] font-semibold text-vc-brown-medium mb-2">每日热量趋势</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Target line */}
        <line x1={PX} y1={targetY} x2={W - PX} y2={targetY} stroke="#D4654A" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        <text x={W - PX + 2} y={targetY + 3} fontSize="7" fill="#D4654A" opacity="0.7">目标</text>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line key={r} x1={PX} y1={PY + chartH * (1 - r)} x2={W - PX} y2={PY + chartH * (1 - r)} stroke="#e5e0db" strokeWidth="0.5" />
        ))}
        {/* Line */}
        <polyline fill="none" stroke="#D4654A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
        {/* Area fill */}
        <polygon fill="url(#calGrad)" opacity="0.15" points={`${toX(0)},${toY(0)} ${points} ${toX(6)},${toY(0)}`} />
        <defs>
          <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4654A" />
            <stop offset="100%" stopColor="#D4654A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Dots + labels */}
        {dailyCals.map((c, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(c)} r="3" fill="#D4654A" />
            <text x={toX(i)} y={H - 1} textAnchor="middle" fontSize="7" fill="#8B6F5E">
              {DAY_LABELS[DAY_KEYS[i]]?.slice(1)}
            </text>
            {c > 0 && (
              <text x={toX(i)} y={toY(c) - 6} textAnchor="middle" fontSize="6.5" fill="#5C3D2E" fontWeight="600">
                {c}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function MacroPieChart({ p, f, c }: { p: number; f: number; c: number }) {
  const total = p + f + c || 1;
  const pPct = p / total, fPct = f / total, cPct = c / total;
  const R = 40, r = 28, cx = 50, cy = 50;
  const describeArc = (startPct: number, endPct: number) => {
    const s = startPct * 2 * Math.PI - Math.PI / 2;
    const e = endPct * 2 * Math.PI - Math.PI / 2;
    const largeArc = endPct - startPct > 0.5 ? 1 : 0;
    return `M${cx + R * Math.cos(s)},${cy + R * Math.sin(s)} A${R},${R} 0 ${largeArc} 1 ${cx + R * Math.cos(e)},${cy + R * Math.sin(e)} L${cx + r * Math.cos(e)},${cy + r * Math.sin(e)} A${r},${r} 0 ${largeArc} 0 ${cx + r * Math.cos(s)},${cy + r * Math.sin(s)} Z`;
  };
  const segments = [
    { pct: pPct, color: "#3B82F6", label: "蛋白质", grams: p },
    { pct: fPct, color: "#F59E0B", label: "脂肪", grams: f },
    { pct: cPct, color: "#22C55E", label: "碳水", grams: c },
  ];
  let acc = 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-vc-sm)]">
      <p className="text-[0.75rem] font-semibold text-vc-brown-medium mb-2">营养分布</p>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
          {segments.map((seg) => {
            if (seg.pct <= 0) { return null; }
            const start = acc;
            acc += seg.pct;
            return <path key={seg.label} d={describeArc(start, acc)} fill={seg.color} />;
          })}
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="9" fontWeight="700" fill="#5C3D2E">
            {Math.round((p * 4 + f * 9 + c * 4))}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="6" fill="#8B6F5E">kcal</text>
        </svg>
        <div className="flex-1 space-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[0.72rem] text-vc-brown-medium flex-1">{seg.label}</span>
              <span className="text-[0.72rem] font-semibold text-vc-brown-dark">{seg.grams}g</span>
              <span className="text-[0.65rem] text-vc-brown-light w-9 text-right">{Math.round(seg.pct * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

  const [analyzeErrors, setAnalyzeErrors] = useState<Record<string, string>>({});

  const handleAnalyze = async (planId: string) => {
    if (analyses[planId] || analyzing[planId]) return;
    setAnalyzing((prev) => ({ ...prev, [planId]: true }));
    setAnalyzeErrors((prev) => ({ ...prev, [planId]: "" }));
    try {
      const res = await fetch("/api/mealplan/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnalyses((prev) => ({ ...prev, [planId]: data }));
      } else {
        setAnalyzeErrors((prev) => ({ ...prev, [planId]: data.error || "分析失败，请稍后重试" }));
      }
    } catch {
      setAnalyzeErrors((prev) => ({ ...prev, [planId]: "网络错误，请检查连接后重试" }));
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
            const analyzeError = analyzeErrors[plan.id];

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

                    {/* Charts */}
                    <div className="grid grid-cols-1 gap-3 mb-3">
                      <CalorieTrendChart plan={plan.plan} target={plan.targetCalories} />
                      <MacroPieChart p={totals.p} f={totals.f} c={totals.c} />
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
                      <div>
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
                              {analyzeError ? "重新分析" : "AI 分析本周饮食"}
                            </>
                          )}
                        </button>
                        {analyzeError && (
                          <p className="text-red-500 text-[0.75rem] text-center mt-2">{analyzeError}</p>
                        )}
                      </div>
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
