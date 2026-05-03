import Client, {
  SendSmsVerifyCodeRequest,
  CheckSmsVerifyCodeRequest,
} from "@alicloud/dypnsapi20170525";
import { $OpenApiUtil } from "@alicloud/openapi-core";

const SIGN_NAME = "速通互联验证码";
const TEMPLATE_CODE = "100001";
const TEMPLATE_PARAM = '{"code":"##code##","min":"5"}';

let _client: Client | null = null;

function getClient(): Client | null {
  if (_client) return _client;

  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) return null;

  const config = new $OpenApiUtil.Config({ accessKeyId, accessKeySecret });
  config.endpoint = "dypnsapi.aliyuncs.com";
  _client = new Client(config);
  return _client;
}

/** Whether real SMS is configured (AK present) */
export function isSmsConfigured(): boolean {
  return !!(
    process.env.ALIBABA_CLOUD_ACCESS_KEY_ID &&
    process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET
  );
}

/** Send a 6-digit SMS verification code. Returns true on success. */
export async function sendVerifyCode(phone: string): Promise<{ success: boolean; message?: string }> {
  const client = getClient();
  if (!client) {
    console.log(`[DEV] Verification code for ${phone}: 123456 (SMS not configured)`);
    return { success: true };
  }

  const request = new SendSmsVerifyCodeRequest({
    phoneNumber: phone,
    signName: SIGN_NAME,
    templateCode: TEMPLATE_CODE,
    templateParam: TEMPLATE_PARAM,
    codeLength: 6,
    validTime: 300,
    interval: 60,
    codeType: 1,
  });

  const resp = await client.sendSmsVerifyCode(request);
  const body = resp.body;

  if (body?.code === "OK" && body.success) {
    return { success: true };
  }

  console.error("[SMS] SendSmsVerifyCode failed:", body?.code, body?.message);
  return { success: false, message: body?.message || "短信发送失败" };
}

/** Check the verification code. Returns true if valid. */
export async function checkVerifyCode(
  phone: string,
  code: string,
): Promise<{ pass: boolean; message?: string }> {
  const client = getClient();
  if (!client) {
    // DEV fallback: accept fixed code
    return { pass: code === "123456" };
  }

  const request = new CheckSmsVerifyCodeRequest({
    phoneNumber: phone,
    verifyCode: code,
  });

  const resp = await client.checkSmsVerifyCode(request);
  const body = resp.body;

  if (body?.code === "OK" && body.model?.verifyResult === "PASS") {
    return { pass: true };
  }

  return { pass: false, message: body?.message || "验证码错误" };
}
