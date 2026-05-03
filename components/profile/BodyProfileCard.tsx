"use client";

import { useState, useEffect } from "react";
import { Target, Sparkles, Loader2, Ruler, Weight, Dumbbell, ChevronDown, ChevronUp, Cookie } from "lucide-react";

interface BodyProfile {
  height: number;
  weight: number;
  goal: string;
  cheatMeals: number;
  targetCalories: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
  aiSummary: string;
}

const GOAL_OPTIONS = [
  { value: "cut", label: "减脂", icon: "🔥" },
  { value: "maintain", label: "维持", icon: "⚖️" },
  { value: "bulk", label: "增肌", icon: "💪" },
];

interface Props {
  onProfileChange?: (profile: BodyProfile | null) => void;
}

export default function BodyProfileCard({ onProfileChange }: Props) {
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);
  const [goal, setGoal] = useState<string>("maintain");
  const [cheatMeals, setCheatMeals] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetch("/api/profile/body")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.targetCalories) {
          setBodyProfile(data);
          setHeight(data.height);
          setWeight(data.weight);
          setGoal(data.goal);
          setCheatMeals(data.cheatMeals ?? 0);
          onProfileChange?.(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/profile/body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ height, weight, goal, cheatMeals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBodyProfile(data);
      setShowSettings(false);
      onProfileChange?.(data);
    } catch (e) {
      console.error("Body analysis failed:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const goalLabel = bodyProfile
    ? GOAL_OPTIONS.find((o) => o.value === bodyProfile.goal)
    : null;

  return (
    <div className="mx-5 bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)]">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vc-terracotta/10 flex items-center justify-center">
            <Target size={20} className="text-vc-terracotta" />
          </div>
          <div className="text-left">
            <div className="text-[0.82rem] text-vc-brown-light">每日目标热量</div>
            {loadingProfile ? (
              <div className="h-6 w-20 bg-vc-cream-deep rounded animate-pulse" />
            ) : bodyProfile ? (
              <div className="text-lg font-semibold text-vc-brown-dark">
                {bodyProfile.targetCalories} <span className="text-sm font-normal text-vc-brown-light">kcal</span>
              </div>
            ) : (
              <div className="text-[0.88rem] text-vc-terracotta font-medium">点击填写身体数据</div>
            )}
          </div>
        </div>
        {showSettings ? (
          <ChevronUp size={20} className="text-vc-brown-light" />
        ) : (
          <ChevronDown size={20} className="text-vc-brown-light" />
        )}
      </button>

      {/* AI summary */}
      {bodyProfile && !showSettings && (
        <div className="mt-3 pt-3 border-t border-vc-cream-deep/60">
          <div className="flex items-center gap-2 mb-2">
            {goalLabel && (
              <span className="text-[0.7rem] bg-vc-forest/8 text-vc-forest px-2 py-0.5 rounded-lg font-medium">
                {goalLabel.icon} {goalLabel.label}
              </span>
            )}
            <span className="text-[0.7rem] text-vc-brown-light">
              {bodyProfile.height}cm · {bodyProfile.weight}kg
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="text-vc-amber shrink-0 mt-0.5" />
            <p className="text-[0.75rem] text-vc-brown-medium leading-relaxed">{bodyProfile.aiSummary}</p>
          </div>
          <div className="flex gap-3 mt-2.5">
            <span className="text-[0.7rem] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg font-medium">P {bodyProfile.targetProtein}g</span>
            <span className="text-[0.7rem] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg font-medium">F {bodyProfile.targetFat}g</span>
            <span className="text-[0.7rem] text-green-600 bg-green-50 px-2 py-0.5 rounded-lg font-medium">C {bodyProfile.targetCarbs}g</span>
          </div>
        </div>
      )}

      {/* Body data form */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-vc-cream-deep">
          <p className="text-[0.78rem] text-vc-brown-light mb-4">
            {bodyProfile ? "更新身体数据，AI 重新计算建议" : "填写身体数据，AI 为你计算每日建议"}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="flex items-center gap-1.5 text-[0.75rem] text-vc-brown-medium mb-1.5">
                <Ruler size={13} />身高 (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-vc-cream text-[0.88rem] text-vc-brown-dark border border-vc-cream-deep focus:outline-none focus:border-vc-terracotta/40 transition-colors"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[0.75rem] text-vc-brown-medium mb-1.5">
                <Weight size={13} />体重 (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-vc-cream text-[0.88rem] text-vc-brown-dark border border-vc-cream-deep focus:outline-none focus:border-vc-terracotta/40 transition-colors"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-1.5 text-[0.75rem] text-vc-brown-medium mb-1.5">
              <Dumbbell size={13} />健身目标
            </label>
            <div className="flex gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-[0.82rem] font-medium transition-all ${
                    goal === opt.value
                      ? "bg-gradient-to-b from-[#2D6A4F] to-[#1B4332] text-white shadow-[0_2px_8px_rgba(45,106,79,0.25)]"
                      : "bg-vc-cream-deep text-vc-brown-medium"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="flex items-center gap-1.5 text-[0.75rem] text-vc-brown-medium mb-1.5">
              <Cookie size={13} />每周放纵餐次数
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setCheatMeals(n)}
                  className={`flex-1 py-2.5 rounded-xl text-[0.82rem] font-medium transition-all ${
                    cheatMeals === n
                      ? "bg-vc-terracotta text-white"
                      : "bg-vc-cream-deep text-vc-brown-medium"
                  }`}
                >
                  {n === 0 ? "无" : `${n} 次`}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !height || !weight}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-vc-terracotta to-[#C7613A] text-white font-semibold text-[0.88rem] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                AI 分析中...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {bodyProfile ? "重新分析" : "AI 生成建议"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
