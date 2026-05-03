"use client";

import { useRouter } from "next/navigation";

export default function SectionHeader({
  title,
  action,
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex justify-between items-baseline px-6 mt-9 mb-4">
      <h2 className="font-serif text-xl text-vc-brown-dark">{title}</h2>
      {action && (
        <button
          onClick={href ? () => router.push(href) : undefined}
          className="text-[0.82rem] text-vc-terracotta font-medium active:opacity-60 transition-opacity"
        >
          {action} ›
        </button>
      )}
    </div>
  );
}
