import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { resolveTenantAdminAccess } from "../../../../admin/lib/admin-access";

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");

    if (!storeSlug) {
      return NextResponse.json({ error: "Missing storeSlug" }, { status: 400 });
    }

    const access = await resolveTenantAdminAccess(session.user.id, storeSlug);
    const store = access.store;

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!access.isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const from = parseDate(searchParams.get("from"), new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    const to = parseDate(searchParams.get("to"), now);

    const { analyticsRepo } = await import("@/repo/analytics-repo");

    const [kpis, timeseries, trafficTotals, visitsTimeseries, topViewed, topAddToCart] = await Promise.all([
      analyticsRepo.getKpiTotals(store, { from, to }),
      analyticsRepo.getRevenueTimeseries(store, { from, to }),
      analyticsRepo.getTrafficTotals(store, { from, to }),
      analyticsRepo.getTrafficTimeseries(store, { from, to }),
      analyticsRepo.getTopProducts(store, { from, to, eventType: "product_view", limit: 5 }),
      analyticsRepo.getTopProducts(store, { from, to, eventType: "add_to_cart", limit: 5 }),
    ]);

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      currency: store.defaultCurrency || "USD",
      kpis,
      timeseries,
      traffic: {
        ...trafficTotals,
        timeseries: visitsTimeseries,
      },
      topViewed,
      topAddToCart,
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
