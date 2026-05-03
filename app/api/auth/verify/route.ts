import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, tasteProfiles } from "@/lib/db/schema";
import { signToken, AUTH_COOKIE } from "@/lib/auth";
import { checkVerifyCode } from "@/lib/sms";

export async function POST(request: NextRequest) {
  const { phone, code } = (await request.json()) as { phone?: string; code?: string };

  if (!phone || !code) {
    return NextResponse.json({ error: "手机号和验证码不能为空" }, { status: 400 });
  }

  // Verify code via Alibaba Cloud (falls back to "123456" when SMS not configured)
  try {
    const result = await checkVerifyCode(phone, code);
    if (!result.pass) {
      return NextResponse.json({ error: result.message || "验证码错误" }, { status: 400 });
    }
  } catch (e) {
    console.error("[SMS] verify error:", e);
    return NextResponse.json({ error: "验证服务异常，请稍后重试" }, { status: 500 });
  }

  // Find or create user
  let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);

  if (!user) {
    [user] = await db
      .insert(users)
      .values({ phone, nickname: "美食家" })
      .returning();

    // Create default taste profile for new user
    await db.insert(tasteProfiles).values({
      userId: user.id,
      spicy: 50,
      sweet: 50,
      savory: 50,
      sour: 50,
      preferredCuisines: [],
    });
  }

  const token = await signToken(user.id);

  const response = NextResponse.json({
    user: { id: user.id, nickname: user.nickname, phone: user.phone },
  });

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_USE_HTTPS === "1",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}
