import { NextRequest } from "next/server";
import { resolveTenantAdminAccess } from "@/modules/admin/services/access-service";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/shared/lib/api/response-utils";

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export const GET = withApi({}, async ({ req, session }) => {
  const { searchParams } = new URL(req.url);
  const storeSlug = searchParams.get("storeSlug");

  if (!storeSlug) throw new HttpError("Missing storeSlug", 400);

  const access = await resolveTenantAdminAccess(session.user.id, storeSlug);
  const store = access.store;

  if (!store) throw new HttpError("Store not found", 404);
  if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

  const now = new Date();
  const from = parseDate(searchParams.get("from"), new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
  const to = parseDate(searchParams.get("to"), now);

  const { analyticsRepo } = await import("@/modules/admin/repo/analytics-repo");

  const [kpis, timeseries, trafficTotals, visitsTimeseries, topViewed, topAddToCart] = await Promise.all([
    analyticsRepo.getKpiTotals(store, { from, to }),
    analyticsRepo.getRevenueTimeseries(store, { from, to }),
    analyticsRepo.getTrafficTotals(store, { from, to }),
    analyticsRepo.getTrafficTimeseries(store, { from, to }),
    analyticsRepo.getTopProducts(store, { from, to, eventType: "product_view", limit: 5 }),
    analyticsRepo.getTopProducts(store, { from, to, eventType: "add_to_cart", limit: 5 }),
  ]);

  return jsonSuccess({
    range: { from: from.toISOString(), to: to.toISOString() },
    currency: store.defaultCurrency || "USD",
    kpis,
    timeseries,
    traffic: { ...trafficTotals, timeseries: visitsTimeseries },
    topViewed,
    topAddToCart,
  });
});
