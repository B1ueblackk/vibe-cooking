import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Vibe Cooking",
  description: "AI 驱动的美食生活应用 — 食材识别、菜谱推荐、营养追踪、美食探索",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FDF6EE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-vc-cream text-vc-brown-dark font-sans">
        <main className="max-w-[430px] mx-auto w-full min-h-dvh relative pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
