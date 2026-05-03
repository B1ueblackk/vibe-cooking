"use client";

import { Heart, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CommunityPost } from "@/lib/types";

const visualMap: Record<string, { emoji: string; bgGradient: string; avatarGradient: string }> = {
  "番茄罗勒意面": { emoji: "🍝", bgGradient: "from-orange-100 to-orange-200", avatarGradient: "from-rose-300 to-rose-200" },
  "牛油果鸡肉碗": { emoji: "🥑", bgGradient: "from-green-100 to-green-200", avatarGradient: "from-teal-300 to-cyan-200" },
  "韩式泡菜豆腐锅": { emoji: "🍲", bgGradient: "from-amber-100 to-amber-200", avatarGradient: "from-purple-300 to-blue-200" },
  "地中海风味沙拉": { emoji: "🥗", bgGradient: "from-lime-100 to-green-100", avatarGradient: "from-blue-300 to-indigo-200" },
  "酸辣粉": { emoji: "🍜", bgGradient: "from-red-100 to-orange-100", avatarGradient: "from-pink-300 to-rose-200" },
};
const defaultVisual = { emoji: "🍽️", bgGradient: "from-gray-100 to-gray-200", avatarGradient: "from-gray-300 to-gray-200" };

function getVisual(title?: string) {
  return (title && visualMap[title]) || defaultVisual;
}

function CommunityCard({ post }: { post: CommunityPost }) {
  const router = useRouter();
  const [saved, setSaved] = useState(post.isSaved ?? false);
  const visual = getVisual(post.recipe?.title);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
    try {
      await fetch(`/api/community/${post.id}/save`, { method: "POST" });
    } catch {
      setSaved(saved);
    }
  };

  return (
    <article
      onClick={() => router.push(`/recipes/${post.recipeId}`)}
      className="shrink-0 w-[260px] bg-white rounded-3xl overflow-hidden shadow-[var(--shadow-vc-md)] scroll-snap-start cursor-pointer active:scale-98 transition-transform"
    >
      {/* image */}
      <div className={`h-[165px] relative bg-gradient-to-br ${visual.bgGradient}`}>
        <div className="w-full h-full flex items-center justify-center text-[3.5rem]">
          {visual.emoji}
        </div>
        <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[0.68rem] font-semibold">
          {post.recipe?.calories ?? 0} kcal
        </span>
      </div>

      {/* body */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <div className={`w-[26px] h-[26px] rounded-full bg-gradient-to-br ${visual.avatarGradient} flex items-center justify-center text-[0.75rem] text-white`}>
            {post.author?.nickname?.[0] ?? "?"}
          </div>
          <span className="text-[0.75rem] font-semibold text-vc-brown-medium">
            {post.author?.nickname ?? "匿名"}
          </span>
        </div>

        <h3 className="font-serif text-base text-vc-brown-dark mb-2 leading-tight">
          {post.recipe?.title ?? "未知菜品"}
        </h3>

        <div className="flex gap-3 mb-3">
          <span className="text-[0.68rem] text-vc-brown-light flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-vc-terracotta" />{post.recipe?.calories ?? 0}kcal
          </span>
          <span className="text-[0.68rem] text-vc-brown-light flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A90D9]" />蛋白 {post.recipe?.protein ?? 0}g
          </span>
          <span className="text-[0.68rem] text-vc-brown-light flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-vc-forest-light" />碳水 {post.recipe?.carbs ?? 0}g
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-vc-cream-deep">
          <span className="text-[0.78rem] text-vc-brown-light flex items-center gap-1.5">
            <Heart size={14} className="text-red-400 fill-red-400" /> {post.likesCount}
          </span>
          <button
            onClick={handleSave}
            className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all ${
              saved ? "bg-vc-amber text-white" : "bg-vc-cream-deep text-vc-brown-light"
            }`}
          >
            <Star size={14} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    fetch("/api/community?sort=hot&limit=5")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch(() => {});
  }, []);

  if (posts.length === 0) return null;

  return (
    <div className="flex gap-3.5 px-5 overflow-x-auto scrollbar-hide scroll-snap-x-mandatory">
      {posts.map((post) => (
        <CommunityCard key={post.id} post={post} />
      ))}
    </div>
  );
}
