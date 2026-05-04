"use client";

import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import type { FriendInfo } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function FriendSidebar({ open, onClose, selectedIds, onToggle }: Props) {
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setFriends(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Sort: starred first
  const sorted = [...friends].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return 0;
  });

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[250] bg-black/30 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full z-[260] w-[75vw] max-w-[320px] bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-14 pb-3 border-b border-vc-cream-deep">
          <h2 className="font-serif text-lg text-vc-brown-dark">好友餐厅</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-vc-cream-deep flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Friend list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-5 h-5 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-vc-brown-light">暂无好友</p>
            </div>
          ) : (
            sorted.map((f) => {
              const isSelected = selectedIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => onToggle(f.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    isSelected ? "bg-vc-forest/10 ring-1 ring-vc-forest/30" : "bg-vc-cream-deep/50 active:bg-vc-cream-deep"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-amber-warm flex items-center justify-center text-white shrink-0 overflow-hidden relative">
                    {f.avatarUrl ? (
                      <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium">{f.nickname[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[0.85rem] font-medium text-vc-brown-dark truncate flex items-center gap-1">
                      {f.starred && <Star size={12} className="text-vc-amber shrink-0" fill="currentColor" />}
                      {f.nickname}
                    </div>
                    <div className="text-[0.68rem] text-vc-brown-light">
                      {f.restaurantCount != null ? `${f.visitedCount ?? 0} 去过 · ${f.wantCount ?? 0} 想去` : ""}
                    </div>
                  </div>
                  {/* Selection indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? "border-vc-forest bg-vc-forest" : "border-vc-brown-light/30"
                  }`}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
