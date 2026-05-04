"use client";

import { useState, useEffect } from "react";
import { X, Send, Loader2, Check } from "lucide-react";
import type { FriendInfo } from "@/lib/types";

interface Props {
  recipeId: string;
  recipeTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function RecommendModal({ recipeId, recipeTitle, open, onClose }: Props) {
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/friends")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setFriends(data); })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const handleSend = async () => {
    if (!selectedId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/recipes/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, friendId: selectedId, message: message.trim() || undefined }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setSelectedId(null);
          setMessage("");
        }, 1200);
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  const selectedFriend = friends.find((f) => f.id === selectedId);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl overflow-hidden max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-vc-cream-deep shrink-0">
          <div className="flex items-center gap-2">
            <Send size={18} className="text-vc-terracotta" />
            <h2 className="font-serif text-lg">推荐给好友</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-vc-cream-deep flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">
          {success ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-vc-forest/10 flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-vc-forest" />
              </div>
              <p className="text-vc-brown-dark font-medium">已推荐给 {selectedFriend?.nickname}</p>
            </div>
          ) : (
            <>
              {/* Recipe info */}
              <div className="bg-vc-cream-deep/60 rounded-xl px-4 py-3 mb-4">
                <p className="text-[0.82rem] font-medium text-vc-brown-dark truncate">{recipeTitle}</p>
              </div>

              {/* Friend list */}
              {friends.length === 0 ? (
                <p className="text-center text-[0.82rem] text-vc-brown-light py-6">暂无好友，先去添加好友吧</p>
              ) : (
                <div className="space-y-2 mb-4">
                  <p className="text-[0.75rem] font-medium text-vc-brown-medium">选择好友</p>
                  {friends.map((f) => {
                    const isSelected = selectedId === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedId(isSelected ? null : f.id)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                          isSelected ? "bg-vc-terracotta/10 ring-2 ring-vc-terracotta/30" : "bg-vc-cream-deep/40"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-amber-warm flex items-center justify-center text-[0.6rem] text-white overflow-hidden shrink-0">
                          {f.avatarUrl ? (
                            <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            f.nickname[0]
                          )}
                        </div>
                        <span className="text-[0.85rem] text-vc-brown-dark">{f.nickname}</span>
                        {isSelected && <Check size={16} className="ml-auto text-vc-terracotta" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Message */}
              {selectedId && (
                <div className="mb-4">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="附上一句话（可选）"
                    maxLength={100}
                    className="w-full bg-vc-cream-deep/40 rounded-xl px-3.5 py-2.5 text-[0.85rem] text-vc-brown-dark placeholder:text-vc-brown-light/50 outline-none focus:ring-2 focus:ring-vc-terracotta/30"
                  />
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!selectedId || sending}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-vc-terracotta to-vc-terracotta-dark text-white font-semibold text-[0.92rem] flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-40 transition-all"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {sending ? "发送中..." : "推荐"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
