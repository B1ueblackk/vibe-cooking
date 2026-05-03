"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, ChevronRight, BookOpen, Heart, MapPin, Award, LogOut } from "lucide-react";
import TasteProfile from "@/components/profile/TasteProfile";
import BodyProfileCard from "@/components/profile/BodyProfileCard";

interface ProfileData {
  user: { id: string; nickname: string; avatarUrl?: string; createdAt: string; phone: string };
  stats: { recipeCount: number; favoriteCount: number; restaurantCount: number };
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch(() => {});
  }, []);

  const recipeCount = profile?.stats.recipeCount ?? 0;
  const favoriteCount = profile?.stats.favoriteCount ?? 0;
  const restaurantCount = profile?.stats.restaurantCount ?? 0;
  const level = Math.floor((recipeCount + favoriteCount + restaurantCount) / 5) + 1;

  const LEVEL_NAMES = [
    "厨房新手", "料理学徒", "家常好手", "美食达人",
    "味觉猎人", "风味大师", "食神", "传奇食神",
  ];
  const levelName = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];

  const stats = [
    { icon: BookOpen, label: "我的菜谱", value: recipeCount, color: "bg-vc-terracotta/10 text-vc-terracotta" },
    { icon: Heart, label: "收藏", value: favoriteCount, color: "bg-red-50 text-red-400" },
    { icon: MapPin, label: "足迹", value: restaurantCount, color: "bg-vc-forest/10 text-vc-forest" },
    { icon: Award, label: levelName, value: `Lv.${level}`, color: "bg-vc-amber/15 text-vc-amber-warm" },
  ];

  const menuItems = [
    { label: "我的菜谱", desc: `${recipeCount} 个原创菜谱`, icon: "📝", href: "/profile/recipes" },
    { label: "AI 生成记录", desc: "查看 AI 生成的食谱历史", icon: "🤖", href: "/profile/ai-history" },
    { label: "收藏菜谱", desc: `${favoriteCount} 个收藏`, icon: "⭐", href: "/profile/favorites" },
    { label: "美食足迹", desc: `${restaurantCount} 家餐厅`, icon: "🗺️", href: "/explore" },
    { label: "饮食报告", desc: "本周营养摄入分析", icon: "📊", href: "/mealplan/report" },
  ];

  const nickname = profile?.user.nickname ?? "美食探索家";
  const days = profile ? daysSince(profile.user.createdAt) : 0;

  return (
    <div className="pt-14">
      {/* Profile header */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-amber-warm flex items-center justify-center text-2xl text-white shadow-[var(--shadow-vc-glow)] overflow-hidden">
            {profile?.user.avatarUrl ? (
              <img src={profile.user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              nickname[0]
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-xl text-vc-brown-dark">{nickname}</h1>
            <p className="text-[0.82rem] text-vc-brown-light mt-0.5">
              已加入 {days} 天 · 上海
            </p>
          </div>
          <button
            onClick={() => router.push("/profile/settings")}
            className="w-10 h-10 rounded-xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform"
          >
            <Settings size={18} className="text-vc-brown-light" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mx-5 mb-6 grid grid-cols-4 gap-2.5">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`rounded-2xl p-3 text-center ${color}`}>
            <Icon size={20} className="mx-auto mb-1.5" />
            <div className="text-base font-semibold">{value}</div>
            <div className="text-[0.65rem] opacity-70">{label}</div>
          </div>
        ))}
      </div>

      {/* Body profile card */}
      <div className="mb-6">
        <BodyProfileCard />
      </div>

      {/* Taste profile */}
      <div className="mb-6">
        <TasteProfile />
      </div>

      {/* Menu list */}
      <div className="mx-5 bg-white rounded-3xl shadow-[var(--shadow-vc-md)] overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            className={`w-full flex items-center gap-3.5 px-5 py-4 active:bg-vc-cream-deep/50 transition-colors ${
              i > 0 ? "border-t border-vc-cream-deep" : ""
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1 text-left">
              <div className="text-[0.88rem] font-medium text-vc-brown-dark">{item.label}</div>
              <div className="text-[0.72rem] text-vc-brown-light">{item.desc}</div>
            </div>
            <ChevronRight size={16} className="text-vc-brown-light/40" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="mx-5 mt-4 mb-6">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 text-red-500 text-[0.88rem] font-medium active:bg-red-100 transition-colors"
        >
          <LogOut size={18} />
          退出登录
        </button>
      </div>
    </div>
  );
}
