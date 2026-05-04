"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Sparkles, ArrowRight, Flame, Beef, Droplets, Wheat } from "lucide-react";

interface BodyProfile {
  height: number;
  weight: number;
  age?: number;
  gender?: string;
  goal: string;
  targetCalories?: number;
  targetProtein?: number;
  targetFat?: number;
  targetCarbs?: number;
  cheatMeals: number;
  aiSummary?: string;
}

const GOAL_LABELS: Record<string, string> = {
  cut: "减脂",
  bulk: "增肌",
  maintain: "维持体重",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (targetCalories: number) => void;
}

export default function GenerateSettingsModal({ open, onClose, onConfirm }: Props) {
  const router = useRouter();
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [calories, setCalories] = useState(2000);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/profile/body")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.height) {
          setBodyProfile(data);
          setCalories(data.targetCalories ?? 2000);
        } else {
          setBodyProfile(null);
          setCalories(2000);
        }
      })
      .catch(() => setBodyProfile(null))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(calories);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-black/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="font-serif text-lg text-vc-brown-dark">生成食谱计划</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-vc-cream-deep flex items-center justify-center">
            <X size={16} className="text-vc-brown-medium" />
          </button>
        </div>

        <div className="px-5 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-vc-terracotta" />
            </div>
          ) : bodyProfile ? (
            <>
              {/* Body profile summary */}
              <div className="bg-gradient-to-br from-vc-forest/8 to-vc-sage-muted/30 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-vc-forest" />
                  <span className="text-[0.78rem] font-semibold text-vc-forest">AI 个性化建议</span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-[0.68rem] text-vc-brown-light">身高</div>
                    <div className="text-sm font-semibold text-vc-brown-dark">{bodyProfile.height}cm</div>
                  </div>
                  <div className="w-px h-6 bg-black/8" />
                  <div className="text-center">
                    <div className="text-[0.68rem] text-vc-brown-light">体重</div>
                    <div className="text-sm font-semibold text-vc-brown-dark">{bodyProfile.weight}kg</div>
                  </div>
                  <div className="w-px h-6 bg-black/8" />
                  <div className="text-center">
                    <div className="text-[0.68rem] text-vc-brown-light">目标</div>
                    <div className="text-sm font-semibold text-vc-brown-dark">{GOAL_LABELS[bodyProfile.goal] ?? bodyProfile.goal}</div>
                  </div>
                  {bodyProfile.cheatMeals > 0 && (
                    <>
                      <div className="w-px h-6 bg-black/8" />
                      <div className="text-center">
                        <div className="text-[0.68rem] text-vc-brown-light">放纵餐</div>
                        <div className="text-sm font-semibold text-vc-brown-dark">{bodyProfile.cheatMeals}次/周</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Macro targets */}
                <div className="flex items-center gap-3 mt-2">
                  {bodyProfile.targetProtein && (
                    <span className="flex items-center gap-1 text-[0.72rem] text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                      <Beef size={11} /> P {bodyProfile.targetProtein}g
                    </span>
                  )}
                  {bodyProfile.targetFat && (
                    <span className="flex items-center gap-1 text-[0.72rem] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      <Droplets size={11} /> F {bodyProfile.targetFat}g
                    </span>
                  )}
                  {bodyProfile.targetCarbs && (
                    <span className="flex items-center gap-1 text-[0.72rem] text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      <Wheat size={11} /> C {bodyProfile.targetCarbs}g
                    </span>
                  )}
                </div>
              </div>

              {/* Calorie adjustment */}
              <div className="bg-white border border-vc-cream-deep rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={16} className="text-vc-terracotta" />
                  <span className="text-sm font-semibold text-vc-brown-dark">每日目标热量</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCalories((c) => Math.max(1000, c - 100))}
                    className="w-10 h-10 rounded-xl bg-vc-cream-deep text-vc-brown-dark font-bold text-lg flex items-center justify-center active:scale-95 transition-transform"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Math.max(800, parseInt(e.target.value) || 0))}
                      className="w-full text-center text-2xl font-serif font-bold text-vc-brown-dark bg-transparent outline-none"
                    />
                    <span className="text-[0.72rem] text-vc-brown-light">kcal / 天</span>
                  </div>
                  <button
                    onClick={() => setCalories((c) => Math.min(5000, c + 100))}
                    className="w-10 h-10 rounded-xl bg-vc-cream-deep text-vc-brown-dark font-bold text-lg flex items-center justify-center active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>
                {bodyProfile.targetCalories && calories !== bodyProfile.targetCalories && (
                  <button
                    onClick={() => setCalories(bodyProfile.targetCalories!)}
                    className="mt-2 text-[0.72rem] text-vc-terracotta underline"
                  >
                    恢复 AI 建议值 ({bodyProfile.targetCalories} kcal)
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* No body profile */}
              <div className="bg-vc-amber/8 rounded-2xl p-5 mb-4 text-center">
                <div className="text-3xl mb-3">📋</div>
                <h3 className="font-serif text-base text-vc-brown-dark mb-1.5">还没有填写身体数据</h3>
                <p className="text-[0.82rem] text-vc-brown-light leading-relaxed mb-4">
                  填写身高体重等信息后，AI 可以为你生成更精准的营养计划
                </p>
                <button
                  onClick={() => { onClose(); router.push("/profile"); }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-vc-terracotta text-white rounded-xl text-sm font-medium active:scale-95 transition-transform"
                >
                  去填写 <ArrowRight size={14} />
                </button>
              </div>

              {/* Manual calorie input */}
              <div className="bg-white border border-vc-cream-deep rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={16} className="text-vc-terracotta" />
                  <span className="text-sm font-semibold text-vc-brown-dark">手动设置每日热量</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCalories((c) => Math.max(1000, c - 100))}
                    className="w-10 h-10 rounded-xl bg-vc-cream-deep text-vc-brown-dark font-bold text-lg flex items-center justify-center active:scale-95 transition-transform"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Math.max(800, parseInt(e.target.value) || 0))}
                      className="w-full text-center text-2xl font-serif font-bold text-vc-brown-dark bg-transparent outline-none"
                    />
                    <span className="text-[0.72rem] text-vc-brown-light">kcal / 天</span>
                  </div>
                  <button
                    onClick={() => setCalories((c) => Math.min(5000, c + 100))}
                    className="w-10 h-10 rounded-xl bg-vc-cream-deep text-vc-brown-dark font-bold text-lg flex items-center justify-center active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-gradient-to-r from-vc-terracotta to-vc-terracotta-dark text-white rounded-2xl font-medium text-[0.92rem] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[var(--shadow-vc-glow)]"
          >
            <Sparkles size={18} />
            AI 生成本周食谱
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
