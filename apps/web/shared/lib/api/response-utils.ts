import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@shopvendly/auth";

export type JsonSuccessPayload<T> = {
  success: true;
  data: T;
};

export type JsonErrorPayload = {
  success: false;
  error: string;
  details?: Record<string, unknown>;
};

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<JsonSuccessPayload<T>>(
    { success: true, data },
    { status: 200, ...init },
  );
}

export function jsonError(message: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json<JsonErrorPayload>(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status },
  );
}

export async function requireAuth(request?: NextRequest) {
  const session = await auth.api.getSession({
    headers: request?.headers ?? await headers(),
  });

  if (!session?.user) {
    throw new HttpError("Unauthorized", 401);
  }

  return session;
}

/**
 * Get the current session or null — does NOT throw on unauthenticated requests.
 * Use this in routes that serve both authenticated users and demo/public visitors.
 */
export async function getOptionalSession(request?: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request?.headers ?? await headers(),
    });
    return session;
  } catch {
    return null;
  }
}

/**
 * Check if a store slug is the demo store.
 * Use with getOptionalSession to guard routes that allow
 * unauthenticated access only for the demo store.
 *
 * Usage:
 *   const session = await getOptionalSession(req);
 *   if (!session?.user && !isDemoStore(store.slug)) return jsonError("Unauthorized", 401);
 */
export function isDemoStore(slug: string) {
  return slug === "vendly";
}

/**
 * Proxy an upstream API response through the standard jsonSuccess/jsonError envelope.
 * Use this when forwarding responses from Express or other internal APIs.
 */
export async function jsonProxy(upstreamResponse: Response) {
  const data = await upstreamResponse.json().catch(() => ({ error: "Failed to read API response" }));

  if (!upstreamResponse.ok) {
    const message = data?.error ?? data?.message ?? "Upstream request failed";
    return jsonError(message, upstreamResponse.status, data?.details);
  }

  return jsonSuccess(data);
}
