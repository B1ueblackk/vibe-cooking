"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author?: { id: string; nickname: string; avatarUrl?: string };
}

interface Props {
  targetType: "post" | "recipe";
  targetId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  const d = Math.floor(hr / 24);
  return `${d}天前`;
}

export default function CommentSection({ targetType, targetId }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?type=${targetType}&id=${targetId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [targetType, targetId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, content: input.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setInput("");
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-vc-md)]">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={16} className="text-vc-brown-medium" />
        <h3 className="text-[0.88rem] font-semibold text-vc-brown-dark">
          评论 {comments.length > 0 && <span className="text-vc-brown-light font-normal">({comments.length})</span>}
        </h3>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="写评论..."
          maxLength={300}
          className="flex-1 bg-vc-cream-deep/60 rounded-xl px-3.5 py-2.5 text-[0.85rem] text-vc-brown-dark placeholder:text-vc-brown-light/50 outline-none focus:ring-2 focus:ring-vc-terracotta/30"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-xl bg-vc-terracotta flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
        >
          {sending ? (
            <Loader2 size={15} className="text-white animate-spin" />
          ) : (
            <Send size={15} className="text-white" />
          )}
        </button>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-4 h-4 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-[0.78rem] text-vc-brown-light py-3">暂无评论，来说第一句吧</p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-vc-terracotta/80 to-vc-amber-warm flex items-center justify-center text-[0.55rem] text-white shrink-0 overflow-hidden">
                {c.author?.avatarUrl ? (
                  <img src={c.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  c.author?.nickname?.[0] ?? "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[0.75rem] font-medium text-vc-brown-dark">
                    {c.author?.nickname ?? "用户"}
                  </span>
                  <span className="text-[0.62rem] text-vc-brown-light">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-[0.82rem] text-vc-brown-medium mt-0.5 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
