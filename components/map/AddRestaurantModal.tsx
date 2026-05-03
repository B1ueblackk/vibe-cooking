"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, MapPin, Star, Plus, Search } from "lucide-react";
import { CUISINE_COLORS } from "@/lib/constants";
import type { Restaurant, RestaurantStatus } from "@/lib/types";

const CUISINE_OPTIONS = ["川菜", "粤菜", "湘菜", "日料", "韩餐", "意餐", "法餐", "东南亚", "西餐", "火锅", "烧烤", "甜品", "咖啡", "小吃"];
const TASTE_OPTIONS = ["辣", "清淡", "甜", "咸鲜", "酸", "麻", "鲜香"];

interface POIResult {
  name: string;
  address: string;
  district: string;
  lng: number;
  lat: number;
}

interface Props {
  restaurant?: Restaurant | null;
  coordinates?: { lng: number; lat: number } | null;
  onSave: (data: {
    name: string;
    address: string;
    lng: number;
    lat: number;
    costAvg: number | null;
    rating: number | null;
    signatureDishes: string[];
    notes: string;
    status: RestaurantStatus;
    cuisines: string[];
    tastes: string[];
  }) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export default function AddRestaurantModal({ restaurant, coordinates, onSave, onClose, onDelete }: Props) {
  const isEdit = !!restaurant;
  const cuisineTagNames = restaurant?.tags.filter((t) => t.type === "cuisine").map((t) => t.name) ?? [];
  const tasteTagNames = restaurant?.tags.filter((t) => t.type === "taste").map((t) => t.name) ?? [];

  const [name, setName] = useState(restaurant?.name ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [costAvg, setCostAvg] = useState<string>(restaurant?.costAvg?.toString() ?? "");
  const [rating, setRating] = useState(restaurant?.rating ?? 0);
  const [notes, setNotes] = useState(restaurant?.notes ?? "");
  const [status, setStatus] = useState<RestaurantStatus>(restaurant?.status ?? "visited");
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set(cuisineTagNames));
  const [selectedTastes, setSelectedTastes] = useState<Set<string>>(new Set(tasteTagNames));
  const [dishes, setDishes] = useState<string[]>(restaurant?.signatureDishes ?? []);
  const [dishInput, setDishInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // POI search state
  const [poiResults, setPoiResults] = useState<POIResult[]>([]);
  const [showPoi, setShowPoi] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lng: number; lat: number } | null>(
    coordinates ?? (restaurant ? { lng: restaurant.longitude, lat: restaurant.latitude } : null)
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // POI search as user types
  const searchPOI = useCallback((keyword: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!keyword.trim() || keyword.trim().length < 2) {
      setPoiResults([]);
      setShowPoi(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/poi-search?keyword=${encodeURIComponent(keyword.trim())}`);
        const data = await res.json();
        setPoiResults(data);
        setShowPoi(data.length > 0);
      } catch {
        setPoiResults([]);
      }
    }, 300);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleAddressChange = (val: string) => {
    setAddress(val);
    searchPOI(val);
  };

  const selectPOI = (poi: POIResult) => {
    if (!name.trim()) setName(poi.name);
    setAddress(poi.district + poi.address);
    setSelectedCoords({ lng: poi.lng, lat: poi.lat });
    setShowPoi(false);
    setPoiResults([]);
  };

  const toggleTag = (set: Set<string>, setter: (s: Set<string>) => void, val: string) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  const addDish = () => {
    const d = dishInput.trim();
    if (d && !dishes.includes(d)) {
      setDishes([...dishes, d]);
      setDishInput("");
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      address: address.trim(),
      lng: selectedCoords?.lng ?? coordinates?.lng ?? 121.465,
      lat: selectedCoords?.lat ?? coordinates?.lat ?? 31.228,
      costAvg: costAvg ? parseInt(costAvg) : null,
      rating: rating || null,
      signatureDishes: dishes,
      notes: notes.trim(),
      status,
      cuisines: Array.from(selectedCuisines),
      tastes: Array.from(selectedTastes),
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[430px] max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-vc-cream-deep">
          <h2 className="font-serif text-lg">{isEdit ? "编辑餐厅" : "添加餐厅"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-vc-cream-deep flex items-center justify-center active:scale-95 transition-transform">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Name */}
          <div>
            <label className="text-[0.78rem] font-semibold text-vc-brown-medium mb-1.5 block">餐厅名称 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入餐厅名称"
              className="w-full bg-vc-cream-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-vc-terracotta/30 transition-all"
            />
          </div>

          {/* Address with POI search */}
          <div className="relative">
            <label className="text-[0.78rem] font-semibold text-vc-brown-medium mb-1.5 flex items-center gap-1">
              <Search size={13} />地址搜索
            </label>
            <input
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => { if (poiResults.length > 0) setShowPoi(true); }}
              placeholder="输入地址或餐厅名，选择搜索结果"
              className="w-full bg-vc-cream-deep/60 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-vc-terracotta/30 transition-all"
            />
            {selectedCoords && (
              <span className="absolute right-3 top-[2.2rem] text-[0.65rem] text-vc-forest bg-vc-forest/10 px-2 py-0.5 rounded-full">
                已定位
              </span>
            )}

            {/* POI suggestions dropdown */}
            {showPoi && poiResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-vc-cream-deep max-h-[200px] overflow-y-auto">
                {poiResults.map((poi, i) => (
                  <button
                    key={`${poi.lng}-${poi.lat}-${i}`}
                    onClick={() => selectPOI(poi)}
                    className="w-full text-left px-4 py-2.5 hover:bg-vc-cream-deep/50 active:bg-vc-cream-deep transition-colors border-b border-vc-cream-deep/50 last:border-0"
                  >
                    <p className="text-[0.82rem] font-medium text-vc-brown-dark truncate">{poi.name}</p>
                    <p className="text-[0.7rem] text-vc-brown-light truncate">
                      <MapPin size={10} className="inline mr-1" />
                      {poi.district}{poi.address}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status toggle */}
          <div>
            <label className="text-[0.78rem] font-semibold text-vc-brown-medium mb-2 block">状态</label>
            <div className="flex gap-2">
              {(["visited", "want"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2.5 rounded-xl text-[0.85rem] font-medium transition-all ${
                    status === s
                      ? s === "visited"
                        ? "bg-vc-forest text-white"
                        : "bg-vc-amber text-white"
                      : "bg-vc-cream-deep text-vc-brown-medium"
                  }`}
                >
                  {s === "visited" ? "✓ 已去过" : "★ 想去"}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine tags */}
          <div>
            <label className="text-[0.78rem] font-semibold text-vc-brown-medium mb-2 block">
              菜系 <span className="font-normal text-vc-brown-light">({selectedCuisines.size} 已选)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((c) => {
                const active = selectedCuisines.has(c);
                const color = CUISINE_COLORS[c] ?? "#8B6F5E";
                return (
                  <button
                    key={c}
                    onClick={() => toggleTag(selectedCuisines, setSelectedCuisines, c)}
                    className="px-3 py-1.5 rounded-full text-[0.78rem] font-medium border-[1.5px] transition-all"
                    style={{
                      background: active ? color : "transparent",
                      borderColor: active ? color : "#e5e0db",
                      color: active ? "white" : "#5C3D2E",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Taste tags */}
          <div>
            <label className="text-[0.78rem] font-semibold text-vc-brown-medium mb-2 block">口味</label>
            <div className="flex flex-wrap gap-2">
              {TASTE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(selectedTastes, setSelectedTastes, t)}
                  className={`px-3 py-1.5 rounded-full text-[0.78rem] font-medium border-[1.5px] transition-all ${
                    selectedTastes.has(t)
                      ? "bg-vc-brown-dark text-white border-vc-brown-dark"
                      : "bg-transparent text-vc-brown-medium border-vc-cream-deep"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Cost + Rating row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.78rem] font-semibold text-vc-brown-medium mb-1.5 block">人均消费</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-vc-brown-light">¥</span>
                <input
                  type="number"
                  value={costAvg}
                  onChange={(e) => setCostAvg(e.target.value)}
                  placeholder="—"
                  className="w-full bg-vc-cream-deep/60 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-vc-terracotta/30"
                />
              </div>
            </div>
            <div>
              <label className="text-[0.78rem] font-semibold text-vc-brown-medium mb-1.5 block">评分</label>
              <div className="flex gap-1 items-center bg-vc-cream-deep/60 rounded-xl px-3 py-2.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s === rating ? 0 : s)}
                    className="transition-transform active:scale-90"
                  >
                    <Star size={20} className={s <= rating ? "text-vc-amber fill-vc-amber" : "text-vc-brown-light/30"} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Signature dishes */}
          <div>
            <label className="text-[0.78rem] font-semibold text-vc-brown-medium mb-1.5 block">招牌菜</label>
            <div className="flex gap-2 mb-2">
              <input
                value={dishInput}
                onChange={(e) => setDishInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDish())}
                placeholder="输入菜名，回车添加"
                className="flex-1 bg-vc-cream-deep/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-vc-terracotta/30"
              />
              <button
                onClick={addDish}
                disabled={!dishInput.trim()}
                className="w-10 h-10 rounded-xl bg-vc-terracotta/10 text-vc-terracotta flex items-center justify-center active:scale-95 disabled:opacity-30"
              >
                <Plus size={18} />
              </button>
            </div>
            {dishes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dishes.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 px-3 py-1 bg-vc-cream-deep rounded-full text-[0.78rem] text-vc-brown-medium">
                    {d}
                    <button onClick={() => setDishes(dishes.filter((x) => x !== d))} className="text-vc-brown-light hover:text-red-400">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[0.78rem] font-semibold text-vc-brown-medium mb-1.5 block">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="随手记录..."
              rows={3}
              className="w-full bg-vc-cream-deep/60 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-vc-terracotta/30"
            />
          </div>

          {/* Delete button (edit mode) */}
          {isEdit && onDelete && (
            <div className="pt-2">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 text-sm text-red-400 font-medium active:opacity-60"
                >
                  删除此餐厅
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-xl bg-vc-cream-deep text-sm text-vc-brown-medium font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm text-white font-medium active:opacity-80"
                  >
                    确认删除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="px-6 py-4 border-t border-vc-cream-deep">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-vc-terracotta to-vc-terracotta-dark text-white font-semibold text-[0.92rem] shadow-[var(--shadow-vc-glow)] active:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isEdit ? "保存修改" : "添加餐厅"}
          </button>
        </div>
      </div>
    </div>
  );
}
