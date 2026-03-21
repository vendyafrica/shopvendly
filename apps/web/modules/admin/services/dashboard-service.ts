import { analyticsRepo } from "@/repo/analytics-repo";
import { ordersRepo } from "@/repo/orders-repo";
import { storeRepo } from "@/repo/store-repo";
import { products, db, count, and, eq, isNull } from "@shopvendly/db";

function toChartDateLabel(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function trendLabel(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? `+${curr}` : "";
  const pct = ((curr - prev) / prev) * 100;
  return pct >= 0 ? `+${pct.toFixed(0)}%` : `${pct.toFixed(0)}%`;
}

function trendTone(curr: number, prev: number): "positive" | "negative" | "neutral" {
  if (prev === 0 && curr === 0) return "neutral";
  return curr >= prev ? "positive" : "negative";
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export const adminDashboardService = {
  async getDashboardData(slug: string) {
    const store = await storeRepo.findAdminBySlug(slug);
    if (!store) return null;

    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevTo = new Date(from.getTime());
    const prevFrom = new Date(prevTo.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [paidKpis, trafficTotals, prevKpis, productCount, revenueRaw, topProductsRaw, recentOrders] = await Promise.all([
      analyticsRepo.getKpiTotals(store, { from, to }),
      analyticsRepo.getTrafficTotals(store, { from, to }),
      analyticsRepo.getKpiTotals(store, { from: prevFrom, to: prevTo }),
      db.select({ value: count() }).from(products).where(and(eq(products.tenantId, store.tenantId), isNull(products.deletedAt))).then((r: { value: number }[]) => r[0]?.value ?? 0),
      analyticsRepo.getRevenueTimeseries(store, { from, to }),
      analyticsRepo.getTopProductsBySales(store, { from, to }),
      ordersRepo.findRecentOrders(store),
    ]);

    const revenueTotalsByDate = new Map(revenueRaw.map((row: any) => [row.date, row.revenuePaid]));
    const ordersTotalsByDate = new Map(revenueRaw.map((row: any) => [row.date, row.ordersPaid]));

    const revenueSeries = Array.from({ length: 31 }).map((_, index) => {
      const day = new Date(from.getTime());
      day.setDate(from.getDate() + index);
      const isoDate = day.toISOString().slice(0, 10);
      return {
        date: toChartDateLabel(isoDate),
        total: revenueTotalsByDate.get(isoDate) ?? 0,
      };
    });

    const ordersSeries = Array.from({ length: 31 }).map((_, index) => {
      const day = new Date(from.getTime());
      day.setDate(from.getDate() + index);
      const isoDate = day.toISOString().slice(0, 10);
      return {
        date: toChartDateLabel(isoDate),
        total: ordersTotalsByDate.get(isoDate) ?? 0,
      };
    });

    const currency = store.defaultCurrency || "UGX";

    const transactionRows = recentOrders.map((o: any) => {
      const itemLabel =
        o.items?.length === 1
          ? o.items[0]?.productName
          : o.items?.length
            ? `${o.items.length} items`
            : "—";

      const status =
        o.paymentStatus === "paid"
          ? "Completed"
          : o.paymentStatus === "failed"
            ? "Failed"
            : "Pending";

      return {
        id: o.orderNumber,
        customer: o.customerName,
        product: itemLabel || "—",
        amount: formatCurrency(o.totalAmount, o.currency || currency),
        status: status as "Completed" | "Failed" | "Pending",
        payment: o.paymentMethod,
        date: new Date(o.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      };
    });

    const stats = [
      {
        label: "Total Revenue",
        value: paidKpis.revenuePaid,
        changeLabel: trendLabel(paidKpis.revenuePaid, prevKpis.revenuePaid),
        changeTone: trendTone(paidKpis.revenuePaid, prevKpis.revenuePaid),
      },
      {
        label: "Paid Orders",
        value: paidKpis.ordersPaid,
        changeLabel: trendLabel(paidKpis.ordersPaid, prevKpis.ordersPaid),
        changeTone: trendTone(paidKpis.ordersPaid, prevKpis.ordersPaid),
      },
      {
        label: "Total Customers",
        value: paidKpis.distinctCustomers || 0,
        changeLabel: trendLabel(paidKpis.distinctCustomers || 0, prevKpis.distinctCustomers || 0),
        changeTone: trendTone(paidKpis.distinctCustomers || 0, prevKpis.distinctCustomers || 0),
      },
      {
        label: "Store Visits",
        value: trafficTotals.visits,
        changeLabel: "",
        changeTone: "neutral" as const,
      }
    ];

    return {
      store,
      stats,
      traffic: trafficTotals,
      productCount,
      revenueSeries,
      ordersSeries,
      topProducts: topProductsRaw.map((p: any) => ({ product: p.product, sales: p.sales })),
      transactionRows,
      currency,
    };
  },
};
