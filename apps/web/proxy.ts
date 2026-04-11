import { NextRequest, NextResponse } from "next/server";

// ── Rate Limiting ──────────────────────────────────────────────────

type RateLimitWindow = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitWindow>();

const RATE_LIMIT_RULES = [
  { match: /^\/api\/auth/, limit: 20, windowMs: 60_000 },
  { match: /^\/api\/products\/bulk/, limit: 10, windowMs: 60_000 },
  { match: /^\/api\//, limit: 60, windowMs: 60_000 },
] as const;

// Clean up stale entries every 5 minutes
let lastCleanup = Date.now();
function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [key, window] of rateLimitStore) {
    if (now > window.resetAt) rateLimitStore.delete(key);
  }
}

function checkRateLimit(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;

  const rule = RATE_LIMIT_RULES.find((r) => r.match.test(pathname));
  if (!rule) return null;

  cleanupStaleEntries();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${ip}:${rule.match.source}`;
  const now = Date.now();

  const window = rateLimitStore.get(key);
  if (!window || now > window.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs });
    return null;
  }

  window.count++;
  if (window.count > rule.limit) {
    const retryAfter = Math.ceil((window.resetAt - now) / 1000);
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rule.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(window.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}

// ── Subdomain Routing ──────────────────────────────────────────────

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
  // Rate limit API routes
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

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
      if (!potentialSlug) {
        return NextResponse.next();
      }
      const knownRoutes = new Set([
        "sell",
        "api",
        "admin",
        "_next",
        "favicon.ico",
        "images",
        "fonts",
        "onboarding",
        "admin",
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
