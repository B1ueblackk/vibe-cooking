import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/uploads", "/friends/invite"];
const STATIC_PREFIXES = ["/_next", "/icons", "/images", "/favicon", "/sw.js", "/manifest.json", "/offline.html"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and public paths
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  // Log API requests with timestamp and user
  if (pathname.startsWith("/api/")) {
    const ts = new Date().toISOString();
    const uid = user?.userId ?? "anonymous";
    console.log(`[${ts}] ${request.method} ${pathname} | user=${uid}`);
  }

  if (!user) {
    // API routes: return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Pages: redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
