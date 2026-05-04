"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, Check } from "lucide-react";
import dynamic from "next/dynamic";

const AvatarCropper = dynamic(() => import("@/components/profile/AvatarCropper"), { ssr: false });

interface TagCatalog {
  cuisine: string[];
  taste: string[];
  scene: string[];
  diet: string[];
}

interface PrefTag {
  name: string;
  type: string;
}

const TAG_TYPE_LABELS: Record<string, string> = {
  cuisine: "菜系偏好",
  taste: "口味偏好",
  scene: "场景偏好",
  diet: "饮食方式",
};

const TAG_TYPE_ICONS: Record<string, string> = {
  cuisine: "🍽️",
  taste: "👅",
  scene: "🎯",
  diet: "🥗",
};

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [selectedTags, setSelectedTags] = useState<PrefTag[]>([]);
  const [tagCatalog, setTagCatalog] = useState<TagCatalog | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ])
      .then(([profileData, tags]) => {
        if (profileData?.user) {
          setNickname(profileData.user.nickname || "");
          setAvatarUrl(profileData.user.avatarUrl || null);
          setPhone(profileData.user.phone || "");
        }
        if (profileData?.preferredTags) {
          setSelectedTags(profileData.preferredTags);
        }
        setTagCatalog(tags);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so re-selecting the same file works
    e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setAvatarUrl(data.url);
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  const toggleTag = (name: string, type: string) => {
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.name === name && t.type === type);
      if (exists) return prev.filter((t) => !(t.name === name && t.type === type));
      return [...prev, { name, type }];
    });
  };

  const isTagSelected = (name: string, type: string) =>
    selectedTags.some((t) => t.name === name && t.type === type);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          avatarUrl,
          preferredTags: selectedTags,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-14 flex items-center justify-center h-60">
        <div className="w-6 h-6 border-2 border-vc-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-14 pb-24">
      {/* Avatar cropper overlay */}
      {cropSrc && (
        <AvatarCropper
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}

      {/* Header */}
      <div className="px-5 mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white shadow-[var(--shadow-vc-sm)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-vc-brown-dark" />
        </button>
        <h1 className="font-serif text-xl text-vc-brown-dark">个人设置</h1>
      </div>

      {/* Avatar */}
      <div className="px-5 mb-6 flex flex-col items-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-vc-terracotta to-vc-amber-warm shadow-[var(--shadow-vc-glow)] active:scale-95 transition-transform"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-3xl text-white">
              {nickname[0] || "?"}
            </span>
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 size={20} className="text-white animate-spin" />
            ) : (
              <Camera size={20} className="text-white" />
            )}
          </div>
        </button>
        <p className="text-[0.72rem] text-vc-brown-light mt-2">点击更换头像</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelect}
        />
      </div>

      {/* Basic info */}
      <div className="mx-5 bg-white rounded-3xl shadow-[var(--shadow-vc-sm)] p-5 mb-4">
        <div className="mb-4">
          <label className="text-[0.75rem] font-medium text-vc-brown-medium mb-1.5 block">昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="输入昵称"
            className="w-full px-4 py-3 rounded-xl bg-vc-cream-deep text-[0.88rem] text-vc-brown-dark outline-none focus:ring-2 focus:ring-vc-terracotta/20 transition-all"
          />
        </div>
        <div>
          <label className="text-[0.75rem] font-medium text-vc-brown-medium mb-1.5 block">手机号</label>
          <div className="px-4 py-3 rounded-xl bg-vc-cream-deep text-[0.88rem] text-vc-brown-light">
            {phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
          </div>
        </div>
      </div>

      {/* Tag preferences */}
      {tagCatalog && (
        <div className="mx-5 space-y-3">
          {(["cuisine", "taste", "scene", "diet"] as const).map((type) => (
            <div key={type} className="bg-white rounded-3xl shadow-[var(--shadow-vc-sm)] p-5">
              <h3 className="text-[0.82rem] font-semibold text-vc-brown-dark mb-3 flex items-center gap-1.5">
                <span>{TAG_TYPE_ICONS[type]}</span>
                {TAG_TYPE_LABELS[type]}
                <span className="text-[0.68rem] font-normal text-vc-brown-light ml-auto">
                  已选 {selectedTags.filter((t) => t.type === type).length}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {tagCatalog[type].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag, type)}
                    className={`px-3 py-1.5 rounded-full text-[0.75rem] font-medium transition-all ${
                      isTagSelected(tag, type)
                        ? "bg-vc-terracotta text-white shadow-sm"
                        : "bg-vc-cream-deep text-vc-brown-medium active:bg-vc-cream-deep/70"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <div className="mx-5 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-vc-terracotta text-white font-medium text-[0.92rem] flex items-center justify-center gap-2 active:bg-vc-terracotta/90 disabled:opacity-60 transition-all"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : saved ? (
            <Check size={18} />
          ) : null}
          {saving ? "保存中..." : saved ? "已保存" : "保存"}
        </button>
      </div>
    </div>
  );
}
