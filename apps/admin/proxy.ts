import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("vendly.session_token")?.value ||
    request.cookies.get("__Secure-vendly.session_token")?.value;

  const isAuthRoute = request.nextUrl.pathname.startsWith("/sign-in") ||
    request.nextUrl.pathname.startsWith("/sign-up") ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/api/admin-signup") ||
    request.nextUrl.pathname.startsWith("/api/verify-email") ||
    request.nextUrl.pathname.startsWith("/api/super-admin/invite/accept");

  const isPublic = request.nextUrl.pathname === "/favicon.ico" ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/images");

  // Allow public routes
  if (isPublic) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!sessionToken && !isAuthRoute) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
