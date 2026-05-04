"use client";

import { useState } from "react";
import { X, Share2, Loader2, Check } from "lucide-react";

interface Props {
  recipeId: string;
  recipeTitle: string;
  open: boolean;
  onClose: () => void;
  onShared?: () => void;
}

export default function ShareModal({ recipeId, recipeTitle, open, onClose, onShared }: Props) {
  const [caption, setCaption] = useState("");
  const [sharing, setSharing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, caption: caption.trim() }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onShared?.();
          onClose();
          setSuccess(false);
          setCaption("");
        }, 1200);
      }
    } catch { /* ignore */ }
    setSharing(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-vc-cream-deep">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-vc-forest" />
            <h2 className="font-serif text-lg">分享到社区</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-vc-cream-deep flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-vc-forest/10 flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-vc-forest" />
              </div>
              <p className="text-vc-brown-dark font-medium">分享成功！</p>
            </div>
          ) : (
            <>
              <div className="bg-vc-cream-deep/60 rounded-xl px-4 py-3 mb-4">
                <p className="text-[0.82rem] font-medium text-vc-brown-dark truncate">{recipeTitle}</p>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="说点什么..."
                rows={3}
                maxLength={200}
                className="w-full bg-vc-cream-deep/40 rounded-xl px-4 py-3 text-[0.88rem] text-vc-brown-dark placeholder:text-vc-brown-light/50 outline-none resize-none focus:ring-2 focus:ring-vc-terracotta/30 mb-4"
              />
              <button
                onClick={handleShare}
                disabled={sharing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-vc-forest to-vc-forest/80 text-white font-semibold text-[0.92rem] flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-60 transition-all"
              >
                {sharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                {sharing ? "分享中..." : "分享到社区"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
