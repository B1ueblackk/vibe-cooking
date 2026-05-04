"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, ChefHat, Sparkles, Bookmark, Check, Share2, Send, Pencil, Trash2, X, Save, Plus, Minus } from "lucide-react";
import { MACRO_COLORS, DAILY_REFERENCE, DIFFICULTY_LABELS } from "@/lib/constants";
import type { Recipe, Ingredient, RecipeStep } from "@/lib/types";
import ImageUpload from "@/components/shared/ImageUpload";
import ShareModal from "@/components/recipe/ShareModal";
import CommentSection from "@/components/shared/CommentSection";
import RecommendModal from "@/components/recipe/RecommendModal";

interface RecipeDetail extends Recipe {
  author?: { nickname: string; avatarUrl?: string };
  isSaved?: boolean;
  isOwner?: boolean;
}

const visualMap: Record<string, { emoji: string; gradient: string }> = {
  "番茄罗勒意面": { emoji: "🍝", gradient: "from-orange-100 to-orange-200" },
  "牛油果鸡肉碗": { emoji: "🥑", gradient: "from-green-100 to-green-200" },
  "韩式泡菜豆腐锅": { emoji: "🍲", gradient: "from-amber-100 to-amber-200" },
  "地中海风味沙拉": { emoji: "🥗", gradient: "from-lime-100 to-green-100" },
  "酸辣粉": { emoji: "🍜", gradient: "from-red-100 to-orange-100" },
};
const defaultVisual = { emoji: "🍽️", gradient: "from-gray-100 to-gray-200" };

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

function formatTime(seconds: number): string {
  if (seconds >= 60) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec ? `${min}分${sec}秒` : `${min}分钟`;
  }
  return `${seconds}秒`;
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    title: string;
    description: string;
    ingredients: Ingredient[];
    steps: RecipeStep[];
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    cookTime: number;
    difficulty: string;
    coverImage?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data: RecipeDetail) => {
        setRecipe(data);
        setSaved(data.isSaved ?? false);
      })
      .catch(() => setError("菜谱未找到"))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSave = async () => {
    setSaved(!saved);
    try {
      await fetch(`/api/recipes/${id}/favorite`, { method: "POST" });
    } catch {
      setSaved(saved);
    }
  };

  const startEdit = () => {
    if (!recipe) return;
    setEditData({
      title: recipe.title,
      description: recipe.description,
      ingredients: [...recipe.ingredients],
      steps: [...recipe.steps],
      calories: recipe.calories,
      protein: recipe.protein,
      fat: recipe.fat,
      carbs: recipe.carbs,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      coverImage: recipe.coverImage,
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const saveEdit = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("保存失败");
      const updated = await res.json();
      setRecipe((prev) => prev ? { ...prev, ...updated } : prev);
      setIsEditing(false);
      setEditData(null);
    } catch {
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        router.replace("/profile/recipes");
      } else {
        alert("删除失败");
      }
    } catch {
      alert("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    if (!editData) return;
    const updated = [...editData.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setEditData({ ...editData, ingredients: updated });
  };

  const addIngredient = () => {
    if (!editData) return;
    setEditData({
      ...editData,
      ingredients: [...editData.ingredients, { name: "", amount: 0, unit: "g" }],
    });
  };

  const removeIngredient = (index: number) => {
    if (!editData) return;
    setEditData({
      ...editData,
      ingredients: editData.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateStep = (index: number, text: string) => {
    if (!editData) return;
    const updated = [...editData.steps];
    updated[index] = { ...updated[index], text };
    setEditData({ ...editData, steps: updated });
  };

  const addStep = () => {
    if (!editData) return;
    setEditData({
      ...editData,
      steps: [...editData.steps, { order: editData.steps.length + 1, text: "" }],
    });
  };

  const removeStep = (index: number) => {
    if (!editData) return;
    const updated = editData.steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order: i + 1 }));
    setEditData({ ...editData, steps: updated });
  };

  if (loading) {
    return (
      <div className="pt-14 px-5">
        <div className="h-56 bg-vc-cream-deep rounded-3xl animate-pulse mb-4" />
        <div className="h-6 w-1/2 bg-vc-cream-deep rounded animate-pulse mb-2" />
        <div className="h-4 w-3/4 bg-vc-cream-deep rounded animate-pulse" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="pt-14 px-5 text-center">
        <p className="text-vc-brown-light text-lg mt-20">{error ?? "加载失败"}</p>
        <button onClick={() => router.back()} className="mt-4 text-vc-terracotta font-medium">
          返回
        </button>
      </div>
    );
  }

  const visual = visualMap[recipe.title] || defaultVisual;
  const displayData = isEditing && editData ? editData : recipe;
  const macros = [
    { label: "热量", value: `${displayData.calories} kcal`, percent: Math.min((displayData.calories / DAILY_REFERENCE.calories) * 100, 100), icon: "🔥", color: MACRO_COLORS.calories, bg: "#FFF3ED" },
    { label: "蛋白质", value: `${displayData.protein}g`, percent: Math.min((displayData.protein / DAILY_REFERENCE.protein) * 100, 100), icon: "P", color: MACRO_COLORS.protein, bg: "#EDF6FF" },
    { label: "脂肪", value: `${displayData.fat}g`, percent: Math.min((displayData.fat / DAILY_REFERENCE.fat) * 100, 100), icon: "F", color: MACRO_COLORS.fat, bg: "#FFF9E6" },
    { label: "碳水", value: `${displayData.carbs}g`, percent: Math.min((displayData.carbs / DAILY_REFERENCE.carbs) * 100, 100), icon: "C", color: MACRO_COLORS.carbs, bg: "#EDFFEF" },
  ];

  return (
    <div className="pb-24">
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-3xl p-6 mx-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-serif text-lg text-vc-brown-dark mb-2">确认删除</h3>
            <p className="text-sm text-vc-brown-medium mb-5">删除后无法恢复，确定要删除这个菜谱吗？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-vc-cream-deep text-vc-brown-medium text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-12 pb-3 bg-gradient-to-b from-white/90 to-white/0 backdrop-blur-sm">
        <button
          onClick={() => { if (isEditing) cancelEdit(); else router.back(); }}
          className="w-10 h-10 rounded-full bg-white/80 shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform"
        >
          {isEditing ? <X size={20} className="text-vc-brown-dark" /> : <ArrowLeft size={20} className="text-vc-brown-dark" />}
        </button>
        <div className="flex gap-2">
          {isEditing ? (
            <button
              onClick={saveEdit}
              disabled={saving}
              className="h-10 px-4 rounded-full bg-vc-forest text-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center gap-1.5 active:scale-95 transition-transform text-sm font-medium disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "保存中" : "保存"}
            </button>
          ) : (
            <button
              onClick={toggleSave}
              className={`w-10 h-10 rounded-full shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-all ${
                saved ? "bg-vc-amber text-white" : "bg-white/80 text-vc-brown-light"
              }`}
            >
              <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      {/* Cover */}
      {isEditing && editData ? (
        <div className="relative h-64">
          {editData.coverImage ? (
            <div className="relative h-full">
              <img src={editData.coverImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  onClick={() => setEditData({ ...editData, coverImage: undefined })}
                  className="px-3 py-1.5 rounded-lg bg-black/50 text-white text-[0.75rem] font-medium"
                >
                  移除
                </button>
              </div>
              <ImageUpload
                onUpload={(url) => setEditData({ ...editData, coverImage: url })}
                className="absolute inset-0 opacity-0"
              />
            </div>
          ) : (
            <ImageUpload
              onUpload={(url) => setEditData({ ...editData, coverImage: url })}
              placeholder="上传菜谱封面"
              className="h-full [&>button]:h-full [&>button]:rounded-none"
            />
          )}
        </div>
      ) : recipe?.coverImage ? (
        <div className="h-64">
          <img src={recipe.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`h-64 bg-gradient-to-br ${visual.gradient} flex items-center justify-center`}>
          <span className="text-8xl">{visual.emoji}</span>
        </div>
      )}

      {/* Content */}
      <div className="px-5 -mt-6 relative">
        {/* Title card */}
        <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)]">
          {isEditing && editData ? (
            <>
              <input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full font-serif text-2xl text-vc-brown-dark mb-2 bg-vc-cream-deep/50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-vc-terracotta/30"
              />
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={2}
                className="w-full text-[0.88rem] text-vc-brown-medium bg-vc-cream-deep/50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-vc-terracotta/30 resize-none mb-3"
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-vc-terracotta" />
                  <input
                    type="number"
                    value={editData.cookTime}
                    onChange={(e) => setEditData({ ...editData, cookTime: parseInt(e.target.value) || 0 })}
                    className="w-14 text-[0.78rem] text-vc-brown-medium bg-vc-cream-deep/50 rounded-lg px-2 py-1 outline-none"
                  />
                  <span className="text-[0.78rem] text-vc-brown-light">分钟</span>
                </div>
                <select
                  value={editData.difficulty}
                  onChange={(e) => setEditData({ ...editData, difficulty: e.target.value })}
                  className="text-[0.78rem] text-vc-brown-medium bg-vc-cream-deep/50 rounded-lg px-2 py-1 outline-none"
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-serif text-2xl text-vc-brown-dark mb-1.5">{recipe.title}</h1>
              <p className="text-[0.88rem] text-vc-brown-light leading-relaxed mb-3">{recipe.description}</p>
              <div className="flex items-center gap-3 text-[0.78rem] text-vc-brown-medium">
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-vc-terracotta" />
                  {recipe.cookTime}分钟
                </span>
                <span className="flex items-center gap-1">
                  <ChefHat size={14} className="text-vc-terracotta" />
                  {DIFFICULTY_LABELS[recipe.difficulty]}
                </span>
                {recipe.isAiGenerated && (
                  <span className="flex items-center gap-1 text-vc-forest">
                    <Sparkles size={14} />
                    AI 生成
                  </span>
                )}
              </div>
              {recipe.author && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-vc-cream-deep">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-amber-warm flex items-center justify-center text-xs text-white font-medium">
                    {recipe.author.nickname[0]}
                  </div>
                  <span className="text-[0.78rem] text-vc-brown-medium">{recipe.author.nickname}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Nutrition */}
        <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)] mt-3">
          <h2 className="font-serif text-[1.05rem] text-vc-brown-dark mb-3">营养成分</h2>
          {isEditing && editData ? (
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: "calories" as const, label: "热量 (kcal)", icon: "🔥" },
                { key: "protein" as const, label: "蛋白质 (g)", icon: "P" },
                { key: "fat" as const, label: "脂肪 (g)", icon: "F" },
                { key: "carbs" as const, label: "碳水 (g)", icon: "C" },
              ].map((m) => (
                <div key={m.key} className="bg-vc-cream-deep/50 rounded-xl px-3 py-2.5">
                  <div className="text-[0.7rem] text-vc-brown-light mb-1">{m.icon} {m.label}</div>
                  <input
                    type="number"
                    value={editData[m.key]}
                    onChange={(e) => setEditData({ ...editData, [m.key]: parseFloat(e.target.value) || 0 })}
                    className="w-full text-[0.88rem] font-semibold text-vc-brown-dark bg-white rounded-lg px-2 py-1.5 outline-none"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5">
              {macros.map((m) => (
                <div key={m.label} className="text-center py-3.5 px-2 rounded-xl" style={{ background: m.bg }}>
                  <MacroCircle percent={m.percent} color={m.color} icon={m.icon} />
                  <div className="text-[0.7rem] text-vc-brown-light font-medium">{m.label}</div>
                  <div className="text-[0.82rem] font-semibold text-vc-brown-dark mt-0.5">{m.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)] mt-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-[1.05rem] text-vc-brown-dark">食材清单</h2>
            {isEditing && (
              <button onClick={addIngredient} className="flex items-center gap-1 text-[0.75rem] text-vc-terracotta font-medium">
                <Plus size={14} /> 添加
              </button>
            )}
          </div>
          {isEditing && editData ? (
            <div className="space-y-2">
              {editData.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, "name", e.target.value)}
                    placeholder="食材名"
                    className="flex-1 text-[0.82rem] bg-vc-cream-deep/50 rounded-lg px-2.5 py-2 outline-none"
                  />
                  <input
                    type="number"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(i, "amount", parseFloat(e.target.value) || 0)}
                    className="w-16 text-[0.82rem] bg-vc-cream-deep/50 rounded-lg px-2.5 py-2 outline-none text-center"
                  />
                  <input
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                    className="w-12 text-[0.82rem] bg-vc-cream-deep/50 rounded-lg px-2 py-2 outline-none text-center"
                  />
                  <button onClick={() => removeIngredient(i)} className="text-red-400 active:text-red-600 p-1">
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 bg-vc-cream-deep/60 rounded-lg px-3 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-vc-terracotta shrink-0" />
                  <span className="text-[0.82rem] text-vc-brown-medium">
                    {ing.name} <span className="text-vc-brown-light">{ing.amount}{ing.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)] mt-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-[1.05rem] text-vc-brown-dark">烹饪步骤</h2>
            {isEditing && (
              <button onClick={addStep} className="flex items-center gap-1 text-[0.75rem] text-vc-terracotta font-medium">
                <Plus size={14} /> 添加
              </button>
            )}
          </div>
          {isEditing && editData ? (
            <div className="space-y-3">
              {editData.steps.map((step, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-vc-terracotta/20 text-vc-terracotta text-[0.75rem] font-bold flex items-center justify-center shrink-0 mt-1">
                    {step.order}
                  </div>
                  <textarea
                    value={step.text}
                    onChange={(e) => updateStep(i, e.target.value)}
                    rows={2}
                    className="flex-1 text-[0.82rem] text-vc-brown-medium bg-vc-cream-deep/50 rounded-xl px-3 py-2 outline-none resize-none"
                  />
                  <button onClick={() => removeStep(i)} className="text-red-400 active:text-red-600 p-1 mt-1">
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recipe.steps.map((step) => (
                <div key={step.order} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-vc-terracotta text-white text-[0.75rem] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <p className="text-[0.88rem] text-vc-brown-medium leading-relaxed">{step.text}</p>
                    {step.timerSeconds && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[0.75rem] text-vc-forest font-medium bg-vc-forest/8 px-2.5 py-1 rounded-full">
                        <Clock size={12} />
                        {formatTime(step.timerSeconds)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      {!isEditing && recipe && (
        <div className="px-5 mt-4 mb-24">
          <CommentSection targetType="recipe" targetId={id} />
        </div>
      )}

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-vc-cream-deep px-5 py-3 flex gap-3 z-50">
        {isEditing ? (
          <>
            <button
              onClick={cancelEdit}
              className="flex-1 py-3 rounded-2xl bg-vc-cream-deep text-vc-brown-medium font-medium text-[0.88rem] flex items-center justify-center gap-2"
            >
              <X size={18} /> 取消
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-vc-forest text-white font-medium text-[0.88rem] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> {saving ? "保存中..." : "保存修改"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleSave}
              className={`flex-1 py-3 rounded-2xl font-medium text-[0.88rem] flex items-center justify-center gap-2 transition-all ${
                saved
                  ? "bg-vc-forest/10 text-vc-forest"
                  : "bg-vc-terracotta text-white active:bg-vc-terracotta/90"
              }`}
            >
              {saved ? <Check size={18} /> : <Bookmark size={18} />}
              {saved ? "已收藏" : "收藏菜谱"}
            </button>
            {recipe.isOwner && (
              <>
                <button
                  onClick={startEdit}
                  className="w-12 h-12 rounded-2xl bg-vc-cream-deep flex items-center justify-center active:bg-vc-cream-deep/70 transition-colors"
                >
                  <Pencil size={18} className="text-vc-brown-medium" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center active:bg-red-100 transition-colors"
                >
                  <Trash2 size={18} className="text-red-400" />
                </button>
              </>
            )}
            <button onClick={() => setShowShareModal(true)} className="w-12 h-12 rounded-2xl bg-vc-cream-deep flex items-center justify-center active:bg-vc-cream-deep/70 transition-colors">
              <Share2 size={20} className="text-vc-brown-medium" />
            </button>
            <button onClick={() => setShowRecommendModal(true)} className="w-12 h-12 rounded-2xl bg-vc-cream-deep flex items-center justify-center active:bg-vc-cream-deep/70 transition-colors">
              <Send size={20} className="text-vc-brown-medium" />
            </button>
          </>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        recipeId={id}
        recipeTitle={recipe?.title ?? ""}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Recommend Modal */}
      <RecommendModal
        recipeId={id}
        recipeTitle={recipe?.title ?? ""}
        open={showRecommendModal}
        onClose={() => setShowRecommendModal(false)}
      />
    </div>
  );
}
