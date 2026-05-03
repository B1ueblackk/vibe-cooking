"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight, Loader2 } from "lucide-react";

type Step = "phone" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const sendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的11位手机号");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("code");
      // Start countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6) {
      setError("请输入6位验证码");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "验证失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-vc-cream flex flex-col">
      {/* Header */}
      <div className="pt-24 px-8">
        <h1 className="font-serif text-[2.5rem] text-vc-brown-dark leading-tight">
          Vibe <span className="text-vc-terracotta">Cooking</span>
        </h1>
        <p className="text-vc-brown-light mt-2 text-[0.95rem]">
          登录以开启你的美食之旅
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-8 pt-12">
        {step === "phone" ? (
          <div className="space-y-4">
            <label className="block text-[0.82rem] font-medium text-vc-brown-medium mb-1.5">
              手机号
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-vc-brown-light" />
              <input
                type="tel"
                maxLength={11}
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(null); }}
                placeholder="请输入手机号"
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white shadow-[var(--shadow-vc-sm)] text-vc-brown-dark text-[1rem] placeholder:text-vc-brown-light/50 outline-none focus:ring-2 focus:ring-vc-terracotta/30 transition-all"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-500 text-[0.78rem]">{error}</p>
            )}

            <button
              onClick={sendCode}
              disabled={loading || phone.length !== 11}
              className="w-full py-4 rounded-2xl bg-vc-terracotta text-white font-medium text-[0.95rem] flex items-center justify-center gap-2 active:bg-vc-terracotta/90 disabled:opacity-50 transition-all mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              获取验证码
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[0.82rem] font-medium text-vc-brown-medium">
                验证码
              </label>
              <button
                onClick={() => { setStep("phone"); setCode(""); setError(null); }}
                className="text-[0.78rem] text-vc-terracotta"
              >
                更换号码
              </button>
            </div>
            <p className="text-[0.78rem] text-vc-brown-light -mt-2">
              已发送至 {phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(null); }}
              placeholder="输入6位验证码"
              className="w-full px-4 py-4 rounded-2xl bg-white shadow-[var(--shadow-vc-sm)] text-vc-brown-dark text-[1.2rem] text-center tracking-[0.5em] placeholder:text-vc-brown-light/50 placeholder:tracking-normal outline-none focus:ring-2 focus:ring-vc-terracotta/30 transition-all"
              autoFocus
            />

            {error && (
              <p className="text-red-500 text-[0.78rem]">{error}</p>
            )}

            <button
              onClick={verify}
              disabled={loading || code.length !== 6}
              className="w-full py-4 rounded-2xl bg-vc-terracotta text-white font-medium text-[0.95rem] flex items-center justify-center gap-2 active:bg-vc-terracotta/90 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              登录
            </button>

            <button
              onClick={sendCode}
              disabled={countdown > 0 || loading}
              className="w-full text-center text-[0.82rem] text-vc-brown-light disabled:opacity-50"
            >
              {countdown > 0 ? `${countdown}s 后重新发送` : "重新发送验证码"}
            </button>
          </div>
        )}

        {/* Dev hint */}
        <div className="mt-8 bg-vc-forest/5 rounded-2xl p-4">
          <p className="text-[0.75rem] text-vc-forest font-medium">开发模式</p>
          <p className="text-[0.72rem] text-vc-brown-light mt-1">
            验证码固定为 <span className="font-mono font-semibold text-vc-brown-dark">123456</span>，无需短信
          </p>
        </div>
      </div>
    </div>
  );
}
