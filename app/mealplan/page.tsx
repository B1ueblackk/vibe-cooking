"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, BarChart3 } from "lucide-react";
import WeekView from "@/components/mealplan/WeekView";

export default function MealPlanPage() {
  const router = useRouter();

  return (
    <div className="pt-14 pb-6">
      {/* Header */}
      <div className="px-6 mb-5">
        <h1 className="font-serif text-2xl text-vc-brown-dark mb-1">每周食谱</h1>
        <p className="text-[0.88rem] text-vc-brown-light">AI 智能搭配，营养均衡每一天</p>
      </div>

      {/* Week view (full mode with day detail) */}
      <WeekView compact={false} />

      {/* Action buttons */}
      <div className="mx-6 mt-5 flex gap-3">
        <button
          onClick={() => router.push("/mealplan/shopping")}
          className="flex-1 py-3 rounded-2xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center gap-2 text-[0.85rem] font-medium text-vc-brown-dark active:bg-vc-cream-deep/50 transition-colors"
        >
          <ShoppingCart size={17} className="text-vc-forest" />
          购物清单
        </button>
        <button
          onClick={() => router.push("/mealplan/report")}
          className="flex-1 py-3 rounded-2xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center gap-2 text-[0.85rem] font-medium text-vc-brown-dark active:bg-vc-cream-deep/50 transition-colors"
        >
          <BarChart3 size={17} className="text-vc-terracotta" />
          饮食报告
        </button>
      </div>

      {/* Tips */}
      <div className="mx-7 mt-4 pt-4 border-t border-vc-cream-deep/60">
        <p className="text-[0.68rem] text-vc-brown-light/70 leading-relaxed">
          点击日期查看每日详情，点击「+生成」按钮可根据你的身体数据和口味偏好自动生成一周三餐计划。
        </p>
      </div>
    </div>
  );
}
