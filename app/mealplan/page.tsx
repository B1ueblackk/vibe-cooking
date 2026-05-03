"use client";

import { useState, useEffect } from "react";

import WeekView from "@/components/mealplan/WeekView";

export default function MealPlanPage() {
  const [targetCalories, setTargetCalories] = useState(1800);
  const [hasBodyProfile, setHasBodyProfile] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/profile/body")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.targetCalories) {
          setTargetCalories(data.targetCalories);
          setHasBodyProfile(true);
        } else {
          setHasBodyProfile(false);
        }
      })
      .catch(() => setHasBodyProfile(false));
  }, []);

  return (
    <div className="pt-14 pb-6">
      {/* Header */}
      <div className="px-6 mb-5">
        <h1 className="font-serif text-2xl text-vc-brown-dark mb-1">每周食谱</h1>
        <p className="text-[0.88rem] text-vc-brown-light">AI 智能搭配，营养均衡每一天</p>
      </div>

      {/* Week view (full mode with day detail) */}
      <WeekView
        compact={false}
        targetCalories={targetCalories}
        onNeedBodyProfile={hasBodyProfile === false ? () => {
          window.location.href = "/profile";
        } : undefined}
      />

      {/* Tips */}
      <div className="mx-7 mt-5 pt-4 border-t border-vc-cream-deep/60">
        <p className="text-[0.68rem] text-vc-brown-light/70 leading-relaxed">
          点击日期查看每日详情，点击「+生成」按钮可根据你的身体数据和口味偏好自动生成一周三餐计划。在"我的"页面可以设置身体数据。
        </p>
      </div>
    </div>
  );
}
