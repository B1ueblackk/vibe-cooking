"use client";

import { MACRO_COLORS, DIFFICULTY_LABELS } from "@/lib/constants";
import { Clock, ChefHat, ChevronDown, ChevronUp, Bookmark, Check } from "lucide-react";
import { useState } from "react";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface RecipeStep {
  order: number;
  text: string;
  timerSeconds?: number;
}

export interface RecipeData {
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cookTime: number;
  difficulty: "easy" | "medium" | "hard";
}

interface MacroRing {
  label: string;
  value: string;
  percent: number;
  icon: string;
  color: string;
  bgColor: string;
}

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

export default function NutritionPanel({ recipe, onSave, saved }: { recipe: RecipeData; onSave?: () => void; saved?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const macros: MacroRing[] = [
    { label: "热量", value: `${recipe.calories} kcal`, percent: Math.min((recipe.calories / 2000) * 100, 100), icon: "🔥", color: MACRO_COLORS.calories, bgColor: "#FFF3ED" },
    { label: "蛋白质", value: `${recipe.protein}g`, percent: Math.min((recipe.protein / 65) * 100, 100), icon: "P", color: MACRO_COLORS.protein, bgColor: "#EDF6FF" },
    { label: "脂肪", value: `${recipe.fat}g`, percent: Math.min((recipe.fat / 55) * 100, 100), icon: "F", color: MACRO_COLORS.fat, bgColor: "#FFF9E6" },
    { label: "碳水", value: `${recipe.carbs}g`, percent: Math.min((recipe.carbs / 300) * 100, 100), icon: "C", color: MACRO_COLORS.carbs, bgColor: "#EDFFEF" },
  ];

  return (
    <section className="mx-5 bg-white rounded-3xl p-[22px] shadow-[var(--shadow-vc-md)]">
      {/* recipe header */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className="w-[58px] h-[58px] rounded-xl bg-gradient-to-br from-vc-cream-deep to-vc-sage-muted flex items-center justify-center text-3xl">
          🍽️
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-[1.05rem] text-vc-brown-dark truncate">{recipe.title}</h3>
          <p className="text-[0.78rem] text-vc-brown-light mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-1"><Clock size={12} />{recipe.cookTime}分钟</span>
            <span>·</span>
            <span className="flex items-center gap-1"><ChefHat size={12} />{DIFFICULTY_LABELS[recipe.difficulty]}</span>
          </p>
        </div>
        <span className="bg-gradient-to-br from-vc-forest to-vc-forest-light text-white px-3 py-1.5 rounded-full text-[0.72rem] font-semibold shrink-0">
          AI 推荐
        </span>
      </div>

      {/* Save button */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={saved}
          className={`w-full mb-4 py-2.5 rounded-xl text-[0.82rem] font-medium flex items-center justify-center gap-2 transition-all ${
            saved
              ? "bg-vc-forest/10 text-vc-forest"
              : "bg-vc-terracotta/10 text-vc-terracotta active:bg-vc-terracotta/20"
          }`}
        >
          {saved ? <Check size={16} /> : <Bookmark size={16} />}
          {saved ? "已保存到我的菜谱" : "保存到我的菜谱"}
        </button>
      )}

      {/* description */}
      <p className="text-[0.82rem] text-vc-brown-medium leading-relaxed mb-4">{recipe.description}</p>

      {/* macro grid */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {macros.map((m) => (
          <div key={m.label} className="text-center py-3.5 px-2 rounded-xl" style={{ background: m.bgColor }}>
            <MacroCircle percent={m.percent} color={m.color} icon={m.icon} />
            <div className="text-[0.7rem] text-vc-brown-light font-medium">{m.label}</div>
            <div className="text-[0.82rem] font-semibold text-vc-brown-dark mt-0.5">{m.value}</div>
          </div>
        ))}
      </div>

      {/* expand for details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[0.82rem] text-vc-terracotta font-medium active:opacity-60 transition-opacity"
      >
        {expanded ? "收起详情" : "查看食材和步骤"}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* ingredients */}
          <div>
            <h4 className="text-[0.85rem] font-semibold text-vc-brown-dark mb-2">食材清单</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 bg-vc-cream-deep/60 rounded-lg px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-vc-terracotta shrink-0" />
                  <span className="text-[0.78rem] text-vc-brown-medium">
                    {ing.name} <span className="text-vc-brown-light">{ing.amount}{ing.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* steps */}
          <div>
            <h4 className="text-[0.85rem] font-semibold text-vc-brown-dark mb-2">烹饪步骤</h4>
            <div className="space-y-3">
              {recipe.steps.map((step) => (
                <div key={step.order} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-vc-terracotta text-white text-[0.7rem] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <p className="text-[0.82rem] text-vc-brown-medium leading-relaxed">{step.text}</p>
                    {step.timerSeconds != null && step.timerSeconds > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[0.72rem] text-vc-forest font-medium bg-vc-forest/8 px-2 py-0.5 rounded-full">
                        <Clock size={11} />
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
    </section>
  );
}
