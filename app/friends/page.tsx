"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Check, X, Copy, Share2, Loader2, Star, Trash2, Search } from "lucide-react";

interface FriendInfo {
  id: string;
  nickname: string;
  avatarUrl?: string;
  friendshipId: string;
  starred?: boolean;
}

interface FriendRequest {
  friendshipId: string;
  senderId: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

const SWIPE_THRESHOLD = 50;
const ACTION_WIDTH = 70;

function SwipeFriendCard({
  friend,
  openId,
  onOpen,
  onDelete,
  onToggleStar,
}: {
  friend: FriendInfo;
  openId: string | null;
  onOpen: (id: string | null) => void;
  onDelete: () => void;
  onToggleStar: () => void;
}) {
  const startX = useRef(0);
  const currentOffset = useRef(0);
  const swiping = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpen = openId === friend.friendshipId;
  const [revealSide, setRevealSide] = useState<"left" | "right" | null>(null);

  const setTranslate = useCallback((x: number) => {
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${x}px)`;
    }
  }, []);

  useEffect(() => {
    if (openId !== friend.friendshipId && containerRef.current) {
      containerRef.current.style.transition = "transform 0.3s ease";
      setTranslate(0);
      setRevealSide(null);
      const t = setTimeout(() => {
        if (containerRef.current) containerRef.current.style.transition = "";
      }, 300);
      return () => clearTimeout(t);
    }
  }, [openId, friend.friendshipId, setTranslate]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentOffset.current = isOpen ? (revealSide === "left" ? ACTION_WIDTH : -ACTION_WIDTH) : 0;
    swiping.current = false;
    if (containerRef.current) containerRef.current.style.transition = "";
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    if (Math.abs(dx) > 8) swiping.current = true;
    // Clamp: left swipe reveals delete (right side), right swipe reveals star (left side)
    const newX = Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, currentOffset.current + dx));
    setTranslate(newX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (containerRef.current) containerRef.current.style.transition = "transform 0.3s ease";

    if (isOpen) {
      // Close if swiped opposite or tap
      setTranslate(0);
      onOpen(null);
      setRevealSide(null);
    } else {
      if (dx < -SWIPE_THRESHOLD) {
        // Left swipe → show delete on right
        setTranslate(-ACTION_WIDTH);
        setRevealSide("left");
        onOpen(friend.friendshipId);
      } else if (dx > SWIPE_THRESHOLD) {
        // Right swipe → show star on left
        setTranslate(ACTION_WIDTH);
        setRevealSide("right");
        onOpen(friend.friendshipId);
      } else {
        setTranslate(0);
      }
    }

    setTimeout(() => {
      if (containerRef.current) containerRef.current.style.transition = "";
    }, 300);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-[var(--shadow-vc-sm)]">
      {/* Left action: Star (revealed on right swipe) */}
      <div className="absolute inset-y-0 left-0 flex">
        <button
          onClick={onToggleStar}
          className={`w-[70px] flex flex-col items-center justify-center gap-1 text-white active:brightness-90 transition-all ${
            friend.starred ? "bg-vc-brown-light" : "bg-vc-amber"
          }`}
        >
          <Star size={18} fill={friend.starred ? "currentColor" : "none"} />
          <span className="text-[0.65rem] font-medium">{friend.starred ? "取消" : "加星"}</span>
        </button>
      </div>

      {/* Right action: Delete (revealed on left swipe) */}
      <div className="absolute inset-y-0 right-0 flex">
        <button
          onClick={onDelete}
          className="w-[70px] flex flex-col items-center justify-center gap-1 bg-red-500 text-white active:brightness-90 transition-all"
        >
          <Trash2 size={18} />
          <span className="text-[0.65rem] font-medium">删除</span>
        </button>
      </div>

      {/* Foreground card */}
      <div
        ref={containerRef}
        className="relative bg-white will-change-transform"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-amber-warm flex items-center justify-center text-white font-medium shrink-0 overflow-hidden">
            {friend.avatarUrl ? (
              <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">{friend.nickname[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.92rem] font-semibold text-vc-brown-dark truncate flex items-center gap-1.5">
              {friend.starred && <Star size={13} className="text-vc-amber shrink-0" fill="currentColor" />}
              {friend.nickname}
            </div>
            <div className="text-[0.72rem] text-vc-brown-light">在探索页可以看到 ta 的餐厅</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  // Add friend form
  const [addTab, setAddTab] = useState<"search" | "link">("search");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Invite
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests"),
      ]);
      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();
      if (Array.isArray(friendsData)) setFriends(friendsData);
      if (Array.isArray(requestsData)) setRequests(requestsData);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    fetch("/api/friends/invite")
      .then((r) => r.json())
      .then((d) => setInviteCode(d.inviteCode ?? ""))
      .catch(() => {});
  }, [loadData]);

  // Sort: starred first
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return 0;
  });

  const handleAddByPhone = async () => {
    if (!phone.trim()) return;
    setAdding(true);
    setAddResult(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddResult({ ok: true, msg: data.message ?? `已向 ${data.targetNickname} 发送好友请求` });
        setPhone("");
        loadData();
      } else {
        setAddResult({ ok: false, msg: data.error });
      }
    } catch {
      setAddResult({ ok: false, msg: "网络错误" });
    }
    setAdding(false);
  };

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/friends/invite?code=${inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("复制邀请链接：", url);
    }
  };

  const handleShareInvite = async () => {
    const url = `${window.location.origin}/friends/invite?code=${inviteCode}`;
    if (navigator.share) {
      navigator.share({ title: "Vibe Cooking 好友邀请", text: "来 Vibe Cooking 一起探索美食吧！", url }).catch(() => {});
    } else {
      handleCopyInvite();
    }
  };

  const handleAccept = async (friendshipId: string) => {
    await fetch(`/api/friends/${friendshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });
    loadData();
  };

  const handleReject = async (friendshipId: string) => {
    await fetch(`/api/friends/${friendshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    loadData();
  };

  const handleDelete = async (friendshipId: string) => {
    await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
    setDeleteId(null);
    setOpenSwipeId(null);
    loadData();
  };

  const handleToggleStar = async (friend: FriendInfo) => {
    const action = friend.starred ? "unstar" : "star";
    try {
      await fetch(`/api/friends/${friend.friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setFriends((prev) =>
        prev.map((f) =>
          f.friendshipId === friend.friendshipId ? { ...f, starred: !f.starred } : f
        )
      );
    } catch { /* ignore */ }
    setOpenSwipeId(null);
  };

  return (
    <div className="pt-14 pb-24">
      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-3xl p-6 mx-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-serif text-lg text-vc-brown-dark mb-2">删除好友</h3>
            <p className="text-sm text-vc-brown-medium mb-5">删除后对方也无法查看你的餐厅，确定吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-vc-cream-deep text-vc-brown-medium text-sm font-medium">
                取消
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add friend glassmorphism modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setAddResult(null); }} />
          <div className="relative w-full max-w-lg mx-4 mb-4 bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/50">
            <h3 className="font-serif text-lg text-vc-brown-dark mb-4">添加好友</h3>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAddTab("search")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  addTab === "search" ? "bg-vc-terracotta text-white" : "bg-vc-cream-deep text-vc-brown-medium"
                }`}
              >
                搜索手机号
              </button>
              <button
                onClick={() => setAddTab("link")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  addTab === "link" ? "bg-vc-terracotta text-white" : "bg-vc-cream-deep text-vc-brown-medium"
                }`}
              >
                邀请链接
              </button>
            </div>

            {addTab === "search" ? (
              <div>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="输入对方手机号"
                    className="flex-1 bg-vc-cream-deep/70 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-vc-terracotta/20"
                  />
                  <button
                    onClick={handleAddByPhone}
                    disabled={adding || !phone.trim()}
                    className="px-5 py-3 bg-vc-terracotta text-white rounded-xl text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform flex items-center gap-1.5"
                  >
                    {adding ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    搜索
                  </button>
                </div>
                {addResult && (
                  <p className={`text-[0.78rem] mt-3 ${addResult.ok ? "text-vc-forest" : "text-red-500"}`}>
                    {addResult.msg}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-[0.82rem] text-vc-brown-light mb-3">分享链接给好友，对方打开后即可添加你</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyInvite}
                    className="flex-1 py-3 bg-vc-cream-deep rounded-xl text-sm font-medium text-vc-brown-dark flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Copy size={14} />
                    {copied ? "已复制" : "复制链接"}
                  </button>
                  <button
                    onClick={handleShareInvite}
                    className="flex-1 py-3 bg-vc-forest/10 rounded-xl text-sm font-medium text-vc-forest flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Share2 size={14} />
                    分享
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 mb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-vc-brown-dark" />
        </button>
        <h1 className="font-serif text-xl text-vc-brown-dark flex-1">好友</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-9 h-9 rounded-xl bg-vc-terracotta text-white flex items-center justify-center active:scale-95 transition-transform shadow-[var(--shadow-vc-sm)]"
        >
          <Plus size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-vc-terracotta" />
        </div>
      ) : (
        <div className="px-5 space-y-5">
          {/* Pending requests */}
          {requests.length > 0 && (
            <div>
              <h2 className="font-serif text-base text-vc-brown-dark mb-3 flex items-center gap-2">
                待处理请求
                <span className="text-[0.7rem] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{requests.length}</span>
              </h2>
              <div className="space-y-2">
                {requests.map((req) => (
                  <div key={req.friendshipId} className="bg-white rounded-2xl p-4 shadow-[var(--shadow-vc-sm)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vc-terracotta to-vc-amber-warm flex items-center justify-center text-white font-medium shrink-0 overflow-hidden">
                      {req.avatarUrl ? (
                        <img src={req.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        req.nickname[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-vc-brown-dark truncate">{req.nickname}</div>
                      <div className="text-[0.7rem] text-vc-brown-light">请求添加你为好友</div>
                    </div>
                    <button
                      onClick={() => handleAccept(req.friendshipId)}
                      className="w-9 h-9 rounded-xl bg-vc-forest/10 text-vc-forest flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleReject(req.friendshipId)}
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-400 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends list with swipe gestures */}
          <div>
            <h2 className="font-serif text-base text-vc-brown-dark mb-3">
              我的好友 <span className="text-vc-brown-light text-sm font-normal">({friends.length})</span>
            </h2>
            {friends.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-[var(--shadow-vc-sm)] text-center">
                <div className="text-3xl mb-3">👥</div>
                <p className="text-sm text-vc-brown-medium">还没有好友</p>
                <p className="text-[0.78rem] text-vc-brown-light mt-1">点击右上角 + 添加好友</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[0.68rem] text-vc-brown-light mb-1">左滑删除 / 右滑加星</p>
                {sortedFriends.map((f) => (
                  <SwipeFriendCard
                    key={f.friendshipId}
                    friend={f}
                    openId={openSwipeId}
                    onOpen={setOpenSwipeId}
                    onDelete={() => setDeleteId(f.friendshipId)}
                    onToggleStar={() => handleToggleStar(f)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
