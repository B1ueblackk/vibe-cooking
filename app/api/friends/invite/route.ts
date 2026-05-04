import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// GET /api/friends/invite — generate invite code for current user
export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inviteCode = btoa(userId);

  return NextResponse.json({
    inviteCode,
    inviteUrl: `/friends/invite?code=${inviteCode}`,
  });
}
