"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";

interface Props {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

function createCroppedImage(imageSrc: string, crop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(crop.width, crop.height);
      const outputSize = 400;
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d")!;

      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(
        img,
        crop.x, crop.y, size, size,
        0, 0, outputSize, outputSize,
      );

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        0.9,
      );
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

export default function AvatarCropper({ imageSrc, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    setSaving(true);
    try {
      const blob = await createCroppedImage(imageSrc, croppedArea);
      onConfirm(blob);
    } catch {
      // fallback: ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Crop area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="bg-black/90 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
        {/* Zoom slider */}
        <div className="flex items-center gap-3 mb-5">
          <ZoomOut size={16} className="text-white/60" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 accent-white appearance-none bg-white/20 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          />
          <ZoomIn size={16} className="text-white/60" />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 text-white text-[0.88rem] font-medium active:bg-white/20 transition-colors"
          >
            <X size={18} />
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-vc-terracotta text-white text-[0.88rem] font-medium active:bg-vc-terracotta/90 disabled:opacity-60 transition-all"
          >
            <Check size={18} />
            {saving ? "处理中..." : "确认"}
          </button>
        </div>
      </div>
    </div>
  );
}
