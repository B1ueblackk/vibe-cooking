"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { TasteProfile as TasteProfileType } from "@/lib/types";

const LEVEL_NAMES = [
  "厨房新手", "料理学徒", "家常好手", "美食达人",
  "味觉猎人", "风味大师", "食神", "传奇食神",
];

function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
}

const barConfig = [
  { key: "spicy" as const, icon: "🌶️", label: "辣", gradient: "from-red-400 to-red-500" },
  { key: "sweet" as const, icon: "🍬", label: "甜", gradient: "from-amber-400 to-yellow-400" },
  { key: "savory" as const, icon: "🧂", label: "咸鲜", gradient: "from-emerald-500 to-emerald-300" },
  { key: "sour" as const, icon: "🍋", label: "酸", gradient: "from-blue-400 to-blue-300" },
];

const CUISINE_EMOJI: Record<string, string> = {
  川菜: "🌶️", 湘菜: "🔥", 粤菜: "🥡", 东北菜: "🥟",
  江浙菜: "🍲", 西北菜: "🍜", 日料: "🍣", 韩餐: "🍖",
  西餐: "🍝", 东南亚: "🍛", 甜品: "🍰", 烧烤: "🍢",
  火锅: "🥘", 轻食: "🥗",
};

interface Props {
  level?: number;
}

export default function TasteProfile({ level }: Props) {
  const [taste, setTaste] = useState<TasteProfileType | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetch("/api/profile/taste")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.spicy !== undefined) setTaste(data as TasteProfileType);
          // Auto-recalculate if dirty, with 1-hour cooldown on failure
          if (data.isDirty) {
            const lastFail = localStorage.getItem("taste_recalc_fail");
            if (lastFail && Date.now() - Number(lastFail) < 3600000) return;
            setRecalculating(true);
            fetch("/api/profile/taste/recalculate", { method: "POST" })
              .then((r) => r.json())
              .then((result) => {
                if (result.spicy !== undefined) {
                  setTaste(result as TasteProfileType);
                  localStorage.removeItem("taste_recalc_fail");
                }
              })
              .catch(() => { localStorage.setItem("taste_recalc_fail", String(Date.now())); })
              .finally(() => setRecalculating(false));
          }
        }
      })
      .catch(() => {});
  }, []);

  const cuisines = taste?.preferredCuisines ?? [];

  return (
    <section className="mx-5 bg-white rounded-3xl p-[22px] shadow-[var(--shadow-vc-md)]">
      {level != null && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[0.72rem] text-vc-terracotta font-semibold bg-vc-terracotta/8 px-2.5 py-1 rounded-xl">
            Lv.{level}
          </span>
          <span className="text-[0.85rem] font-medium text-vc-brown-dark">
            {getLevelName(level)}
          </span>
        </div>
      )}

      {recalculating && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <Loader2 size={14} className="animate-spin text-vc-terracotta" />
          <span className="text-[0.75rem] text-vc-terracotta">AI 正在分析你的口味偏好...</span>
        </div>
      )}

      <div className="flex gap-5">
        {/* Left: taste bars */}
        <div className="flex-1 flex flex-col gap-3">
          {barConfig.map((bar) => (
            <div key={bar.key} className="flex items-center gap-2">
              <span className="text-sm w-5 text-center">{bar.icon}</span>
              <span className="text-[0.72rem] text-vc-brown-medium w-8 font-medium">{bar.label}</span>
              <div className="flex-1 h-1.5 bg-vc-cream-deep rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${bar.gradient} transition-all duration-1000`}
                  style={{ width: `${taste?.[bar.key] ?? 50}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px bg-vc-cream-deep" />

        {/* Right: cuisine tags */}
        <div className="flex-1 flex flex-wrap content-start gap-1.5">
          {cuisines.length > 0 ? (
            cuisines.map((c) => (
              <span
                key={c}
                className="px-2.5 py-[5px] rounded-full text-[0.72rem] font-medium bg-vc-cream-deep text-vc-brown-dark"
              >
                {CUISINE_EMOJI[c] ?? "🍽️"} {c}
              </span>
            ))
          ) : (
            <p className="text-[0.72rem] text-vc-brown-light leading-relaxed">
              使用更多功能后，AI 将自动分析你的菜系偏好
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
