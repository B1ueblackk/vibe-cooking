"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Clock, Flame } from "lucide-react";
import type { Recipe } from "@/lib/types";

const DIFFICULTY_LABEL: Record<string, string> = { easy: "简单", medium: "中等", hard: "困难" };

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/recipes?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (Array.isArray(data)) setResults(data);
    } catch { /* ignore */ }
    setLoading(false);
    setSearched(true);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 300);
  };

  return (
    <div className="pt-3 pb-24 min-h-screen bg-vc-cream">
      {/* Search header */}
      <div className="px-4 mb-4 flex items-center gap-2.5">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform shrink-0"
        >
          <ArrowLeft size={18} className="text-vc-brown-dark" />
        </button>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vc-brown-light" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="搜索菜谱..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-vc-cream-deep text-[0.88rem] text-vc-brown-dark placeholder:text-vc-brown-light/50 focus:outline-none focus:ring-2 focus:ring-vc-terracotta/30"
          />
        </div>
      </div>

      {/* Results */}
      <div className="px-4">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center pt-20">
            <Search size={40} className="mx-auto text-vc-brown-light/30 mb-3" />
            <p className="text-vc-brown-light text-sm">输入关键词搜索菜谱</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center pt-20">
            <div className="text-3xl mb-3">🔍</div>
            <p className="text-vc-brown-medium text-sm">未找到相关菜谱</p>
            <p className="text-vc-brown-light text-xs mt-1">换个关键词试试</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[0.75rem] text-vc-brown-light mb-1">找到 {results.length} 个结果</p>
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/recipes/${r.id}`)}
                className="w-full bg-white rounded-2xl shadow-[var(--shadow-vc-sm)] p-3.5 text-left active:bg-vc-cream-deep/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {r.coverImage ? (
                    <img src={r.coverImage} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-vc-terracotta/20 to-vc-amber/20 flex items-center justify-center text-2xl shrink-0">
                      🍳
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[0.88rem] font-semibold text-vc-brown-dark truncate">{r.title}</h3>
                    <p className="text-[0.75rem] text-vc-brown-light mt-0.5 line-clamp-1">{r.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[0.68rem] text-vc-brown-light">
                        <Flame size={11} className="text-vc-terracotta" />
                        {r.calories} kcal
                      </span>
                      <span className="flex items-center gap-1 text-[0.68rem] text-vc-brown-light">
                        <Clock size={11} />
                        {r.cookTime}分钟
                      </span>
                      <span className="text-[0.62rem] px-1.5 py-0.5 rounded-md bg-vc-cream-deep text-vc-brown-medium">
                        {DIFFICULTY_LABEL[r.difficulty] ?? r.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
