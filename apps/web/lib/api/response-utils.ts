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
