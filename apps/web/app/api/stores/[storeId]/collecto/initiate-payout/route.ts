import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { storeRepo } from "@/repo/store-repo";
import { tenantMembershipRepo } from "@/repo/tenant-membership-repo";

type RouteParams = {
  params: Promise<{ storeId: string }>;
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : undefined);
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = await params;
    const store = await storeRepo.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const membership = await tenantMembershipRepo.findByUserAndTenant(session.user.id, store.tenantId);

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_API_URL; cannot reach Express API for Collecto payout." }, { status: 500 });
    }

    const response = await fetch(`${apiBase}/api/stores/${encodeURIComponent(storeId)}/collecto/initiate-payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json().catch(() => ({ error: "Failed to read API response" }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying Collecto payout initiation:", error);
    return NextResponse.json({ error: "Failed to initiate Collecto payout" }, { status: 500 });
  }
}
