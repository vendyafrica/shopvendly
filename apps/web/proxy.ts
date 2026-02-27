import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shopvendly.store";
const RESERVED_SUBDOMAINS = new Set(["www", "admin", "api", "ai", "support", "docs"]);

function normalizeHost(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/^www\./, "");
}

const NORMALIZED_ROOT_DOMAIN = normalizeHost(ROOT_DOMAIN);

function getSubdomain(req: NextRequest) {
  const rawHost = (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))?.split(":")[0];
  if (!rawHost) return null;

  const host = normalizeHost(rawHost);

  if (host === NORMALIZED_ROOT_DOMAIN) {
    return null;
  }

  if (host.endsWith(`.${NORMALIZED_ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${NORMALIZED_ROOT_DOMAIN}`, "");
    if (RESERVED_SUBDOMAINS.has(subdomain)) return null;
    return subdomain;
  }

  return null;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const subdomain = getSubdomain(req);

  if (subdomain) {
    if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith(`/${subdomain}`)) {
      return NextResponse.next();
    }

    const url = req.nextUrl.clone();
    url.pathname = `/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  const host = req.headers.get("host")?.split(":")[0];
  if (host === "localhost" || host === "127.0.0.1") {
    const pathParts = pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const potentialSlug = pathParts[0];
      const knownRoutes = new Set([
        "sell",
        "api",
        "admin",
        "_next",
        "favicon.ico",
        "images",
        "fonts",
        "onboarding",
        "dashboard",
      ]);
      if (!knownRoutes.has(potentialSlug) && !potentialSlug.startsWith("_")) {
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
