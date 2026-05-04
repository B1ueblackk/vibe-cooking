"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Search,
  CalendarDays,
  Users,
  UserCircle,
} from "lucide-react";

const tabs = [
  { key: "home", href: "/", label: "首页", icon: Home },
  { key: "explore", href: "/explore", label: "探索", icon: Search },
  { key: "mealplan", href: "/mealplan", label: "食谱", icon: CalendarDays },
  { key: "community", href: "/community", label: "社区", icon: Users },
  { key: "profile", href: "/profile", label: "我的", icon: UserCircle },
] as const;

function matchTab(pathname: string): string {
  if (pathname === "/") return "home";
  const seg = pathname.split("/")[1];
  return tabs.find((t) => t.key === seg)?.key || "home";
}

export default function BottomNav() {
  const pathname = usePathname();
  const current = matchTab(pathname);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);

  useEffect(() => {
    // Check pending friend requests for badge
    fetch("/api/friends/requests")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHasPendingRequests(true);
        }
      })
      .catch(() => {});
  }, [pathname]); // Re-check when navigating

  // Hide on login page
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/88 backdrop-blur-xl border-t border-vc-brown-dark/4">
      <div className="max-w-[430px] mx-auto flex justify-around pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        {tabs.map(({ key, href, label, icon: Icon }) => {
          const isActive = current === key;
          return (
            <Link
              key={key}
              href={href}
              className="relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all active:scale-92"
            >
              <Icon
                size={22}
                className={`transition-transform ${
                  isActive
                    ? "text-vc-terracotta scale-110"
                    : "text-vc-brown-light"
                }`}
                fill={isActive ? "currentColor" : "none"}
              />
              {/* Red dot for pending friend requests */}
              {key === "profile" && hasPendingRequests && (
                <span className="absolute top-0.5 right-2.5 w-2 h-2 rounded-full bg-red-500" />
              )}
              <span
                className={`text-[0.62rem] font-semibold tracking-wide ${
                  isActive ? "text-vc-terracotta" : "text-vc-brown-light"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-vc-terracotta" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
