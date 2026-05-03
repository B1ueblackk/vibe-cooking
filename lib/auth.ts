import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "vc-token";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub === "string") {
      return { userId: payload.sub };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get authenticated user ID from request cookies.
 * Works in API route handlers (server-side).
 */
export async function getAuthUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const result = await verifyToken(token);
  return result?.userId ?? null;
}

/**
 * Verify token from a raw cookie header string (for middleware).
 */
export async function verifyFromCookieHeader(cookieHeader: string): Promise<string | null> {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]+)`));
  if (!match) return null;
  const result = await verifyToken(match[1]);
  return result?.userId ?? null;
}
