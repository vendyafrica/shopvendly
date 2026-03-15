import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { storeService } from "@/app/[handle]/lib/store-service";
import { db } from "@shopvendly/db/db";
import { tenantMemberships } from "@shopvendly/db/schema";
import { and, eq } from "@shopvendly/db";

type RouteParams = {
  params: Promise<{ storeId: string }>;
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : undefined);
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = await params;
    const store = await storeService.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const membership = await db.query.tenantMemberships.findFirst({
      where: and(eq(tenantMemberships.userId, session.user.id), eq(tenantMemberships.tenantId, store.tenantId)),
    });

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_API_URL; cannot reach Express API for Collecto balance." }, { status: 500 });
    }

    const response = await fetch(`${apiBase}/api/stores/${encodeURIComponent(storeId)}/collecto/available-balance`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({ error: "Failed to read API response" }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying Collecto available balance:", error);
    return NextResponse.json({ error: "Failed to fetch Collecto available balance" }, { status: 500 });
  }
}
