"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, Star, Share2, TrendingUp, Clock } from "lucide-react";
import type { CommunityPost } from "@/lib/types";

// Visual lookup for known recipes (keeps the current design while data comes from DB)
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "昨天";
  return `${days}天前`;
}

type SortMode = "hot" | "latest";

export default function CommunityPage() {
  const router = useRouter();
  const [sort, setSort] = useState<SortMode>("hot");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community?sort=${sort}`);
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.error("Failed to load posts:", e);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const toggleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likesCount: p.likesCount + (p.isLiked ? -1 : 1) }
          : p
      )
    );
    try {
      await fetch(`/api/community/${postId}/like`, { method: "POST" });
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likesCount: p.likesCount + (p.isLiked ? -1 : 1) }
            : p
        )
      );
    }
  };

  const toggleSave = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    );
    try {
      await fetch(`/api/community/${postId}/save`, { method: "POST" });
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
      );
    }
  };

  return (
    <div className="pt-14">
      {/* Header */}
      <div className="px-6 mb-4">
        <h1 className="font-serif text-2xl text-vc-brown-dark mb-1">美食社区</h1>
        <p className="text-[0.88rem] text-vc-brown-light">发现灵感，分享你的拿手菜</p>
      </div>

      {/* Sort tabs */}
      <div className="px-6 mb-4 flex gap-2">
        <button
          onClick={() => setSort("hot")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.82rem] font-medium transition-all ${
            sort === "hot"
              ? "bg-vc-terracotta text-white"
              : "bg-white text-vc-brown-medium shadow-[var(--shadow-vc-sm)]"
          }`}
        >
          <TrendingUp size={14} /> 最热
        </button>
        <button
          onClick={() => setSort("latest")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.82rem] font-medium transition-all ${
            sort === "latest"
              ? "bg-vc-terracotta text-white"
              : "bg-white text-vc-brown-medium shadow-[var(--shadow-vc-sm)]"
          }`}
        >
          <Clock size={14} /> 最新
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="px-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl h-80 animate-pulse shadow-[var(--shadow-vc-md)]" />
          ))}
        </div>
      )}

      {/* Feed */}
      {!loading && (
        <div className="px-5 space-y-4">
          {posts.map((post) => {
            const visual = getVisual(post.recipe?.title);

            return (
              <article
                key={post.id}
                onClick={() => router.push(`/recipes/${post.recipeId}`)}
                className="bg-white rounded-3xl overflow-hidden shadow-[var(--shadow-vc-md)] cursor-pointer active:scale-[0.99] transition-transform"
              >
                {/* Image */}
                <div className={`h-48 relative bg-gradient-to-br ${visual.bgGradient}`}>
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {visual.emoji}
                  </div>
                  <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[0.72rem] font-semibold">
                    {post.recipe?.calories ?? 0} kcal
                  </span>
                </div>

                {/* Body */}
                <div className="p-5">
                  {/* Author row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${visual.avatarGradient} flex items-center justify-center text-sm text-white font-medium`}>
                      {post.author?.nickname?.[0] ?? "?"}
                    </div>
                    <span className="text-[0.82rem] font-semibold text-vc-brown-medium">
                      {post.author?.nickname ?? "匿名"}
                    </span>
                    <span className="text-[0.72rem] text-vc-brown-light ml-auto">
                      {timeAgo(post.createdAt)}
                    </span>
                  </div>

                  {/* Dish name & desc */}
                  <h3 className="font-serif text-lg text-vc-brown-dark mb-1.5">
                    {post.recipe?.title ?? "未知菜品"}
                  </h3>
                  <p className="text-[0.82rem] text-vc-brown-light leading-relaxed mb-3">
                    {post.caption}
                  </p>

                  {/* Macros */}
                  <div className="flex gap-3 mb-4">
                    {[
                      { label: "蛋白质", val: `${post.recipe?.protein ?? 0}g`, color: "bg-blue-500" },
                      { label: "碳水", val: `${post.recipe?.carbs ?? 0}g`, color: "bg-green-500" },
                      { label: "脂肪", val: `${post.recipe?.fat ?? 0}g`, color: "bg-amber-400" },
                    ].map((m) => (
                      <span key={m.label} className="text-[0.72rem] text-vc-brown-light flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${m.color}`} />
                        {m.label} {m.val}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-5 pt-3.5 border-t border-vc-cream-deep">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                      className="flex items-center gap-1.5 text-[0.82rem] text-vc-brown-light active:scale-95 transition-transform"
                    >
                      <Heart size={18} className={post.isLiked ? "text-red-400 fill-red-400" : ""} />
                      {post.likesCount}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave(post.id); }}
                      className="flex items-center gap-1.5 text-[0.82rem] text-vc-brown-light active:scale-95 transition-transform"
                    >
                      <Star size={18} className={post.isSaved ? "text-vc-amber fill-vc-amber" : ""} />
                      收藏
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto flex items-center gap-1.5 text-[0.82rem] text-vc-brown-light active:scale-95 transition-transform"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
