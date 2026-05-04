"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIHistoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile/recipes");
  }, [router]);
  return null;
}
