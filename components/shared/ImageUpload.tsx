"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

interface Props {
  value?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  placeholder?: string;
}

export default function ImageUpload({ value, onUpload, onRemove, className = "", placeholder = "上传图片" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        onUpload(data.url);
      }
    } catch { /* ignore */ }
    setUploading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={value} alt="" className="w-full h-36 object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
            >
              <X size={14} className="text-white" />
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/50 text-white text-[0.7rem] font-medium"
          >
            更换
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-28 rounded-xl border-2 border-dashed border-vc-brown-light/30 bg-vc-cream-deep/40 flex flex-col items-center justify-center gap-1.5 active:bg-vc-cream-deep/70 transition-colors"
        >
          {uploading ? (
            <Loader2 size={22} className="animate-spin text-vc-terracotta" />
          ) : (
            <Camera size={22} className="text-vc-brown-light" />
          )}
          <span className="text-[0.75rem] text-vc-brown-light">{uploading ? "上传中..." : placeholder}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
