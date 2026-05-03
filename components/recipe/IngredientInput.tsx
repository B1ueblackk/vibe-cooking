"use client";

import { Camera, Loader2, Send } from "lucide-react";
import { useState } from "react";

const quickTags = ["快手早餐", "减脂餐", "增肌食谱", "家常菜"];

interface Props {
  onGenerate: (ingredients: string[]) => void;
  loading?: boolean;
}

export default function HeroInput({ onGenerate, loading }: Props) {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    // Split by common delimiters
    const ingredients = trimmed
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ingredients.length) onGenerate(ingredients);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="mx-5 mt-6 bg-gradient-to-br from-vc-terracotta to-vc-terracotta-dark rounded-[32px] p-7 relative overflow-hidden shadow-[var(--shadow-vc-glow)]">
      {/* decorative circles */}
      <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-white/8" />
      <div className="absolute -bottom-12 -left-5 w-24 h-24 rounded-full bg-white/5" />

      <h2 className="font-serif text-[1.35rem] text-white mb-1.5 relative z-10">
        拍一拍你的冰箱
      </h2>
      <p className="text-sm text-white/78 mb-5 leading-relaxed relative z-10">
        输入食材或拍照，AI 秒出菜谱和营养方案
      </p>

      <div className="flex gap-2.5 relative z-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="鸡胸肉、西兰花、鸡蛋..."
          disabled={loading}
          className="flex-1 bg-white/18 border-[1.5px] border-white/25 rounded-[18px] px-4 py-3.5 text-sm text-white placeholder:text-white/55 backdrop-blur-sm outline-none focus:bg-white/25 focus:border-white/45 transition-all font-sans disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          className="w-[50px] h-[50px] rounded-[18px] bg-white text-vc-terracotta flex items-center justify-center shadow-md active:scale-92 transition-transform disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
        <button className="w-[50px] h-[50px] rounded-[18px] bg-white/20 text-white flex items-center justify-center backdrop-blur-sm active:scale-92 transition-transform border border-white/25">
          <Camera size={22} />
        </button>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap relative z-10">
        {quickTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setQuery(tag)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white/15 border border-white/20 rounded-full text-[0.78rem] text-white/90 backdrop-blur-sm active:bg-white/28 transition-all disabled:opacity-50"
          >
            {tag}
          </button>
        ))}
      </div>
    </section>
  );
}
