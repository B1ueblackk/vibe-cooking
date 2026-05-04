"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-code">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("no-code");
      return;
    }

    fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message ?? `已成为好友！`);
        } else {
          setStatus("error");
          setMessage(data.error ?? "添加失败");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("网络错误，请重试");
      });
  }, [code]);

  return (
    <div className="pt-14 px-5 flex flex-col items-center justify-center min-h-[60vh]">
      {status === "loading" && (
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-vc-terracotta mx-auto mb-4" />
          <p className="text-vc-brown-medium">正在处理好友请求...</p>
        </div>
      )}
      {status === "success" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-vc-forest/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus size={28} className="text-vc-forest" />
          </div>
          <h1 className="font-serif text-xl text-vc-brown-dark mb-2">好友添加成功</h1>
          <p className="text-sm text-vc-brown-light mb-6">{message}</p>
          <button
            onClick={() => router.push("/friends")}
            className="px-6 py-3 bg-vc-terracotta text-white rounded-2xl font-medium active:scale-95 transition-transform"
          >
            查看好友列表
          </button>
        </div>
      )}
      {status === "error" && (
        <div className="text-center">
          <div className="text-4xl mb-4">😅</div>
          <h1 className="font-serif text-xl text-vc-brown-dark mb-2">添加失败</h1>
          <p className="text-sm text-vc-brown-light mb-6">{message}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-vc-cream-deep text-vc-brown-dark rounded-2xl font-medium active:scale-95 transition-transform"
          >
            返回首页
          </button>
        </div>
      )}
      {status === "no-code" && (
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="font-serif text-xl text-vc-brown-dark mb-2">无效链接</h1>
          <p className="text-sm text-vc-brown-light mb-6">邀请链接无效或已过期</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-vc-cream-deep text-vc-brown-dark rounded-2xl font-medium active:scale-95 transition-transform"
          >
            返回首页
          </button>
        </div>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="pt-14 px-5 flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-vc-terracotta" />
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
