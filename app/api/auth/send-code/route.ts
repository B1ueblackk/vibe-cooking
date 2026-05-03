import { NextRequest, NextResponse } from "next/server";

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export async function POST(request: NextRequest) {
  const { phone } = (await request.json()) as { phone?: string };

  if (!phone || !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
  }

  // DEV: fixed code 123456, no SMS sent
  // TODO: integrate real SMS provider (e.g. Aliyun SMS) before production
  console.log(`[DEV] Verification code for ${phone}: 123456`);

  return NextResponse.json({ success: true });
}
