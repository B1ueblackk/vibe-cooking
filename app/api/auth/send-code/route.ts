import { NextRequest, NextResponse } from "next/server";
import { sendVerifyCode } from "@/lib/sms";

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export async function POST(request: NextRequest) {
  const { phone } = (await request.json()) as { phone?: string };

  if (!phone || !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
  }

  try {
    const result = await sendVerifyCode(phone);
    if (!result.success) {
      return NextResponse.json({ error: result.message || "短信发送失败" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[SMS] send-code error:", e);
    return NextResponse.json({ error: "短信服务异常，请稍后重试" }, { status: 500 });
  }
}
