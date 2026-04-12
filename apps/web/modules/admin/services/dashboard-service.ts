import { analyticsRepo } from "@/modules/admin/repo/analytics-repo";
import { ordersRepo } from "@/modules/orders/repo/orders-repo";
import { storeRepo } from "@/modules/storefront/repo/store-repo";
import { products, db, count, and, eq, isNull } from "@shopvendly/db";

function toChartDateLabel(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const trendLabel = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? `+${current.toFixed(1).replace(/\.0$/, "")}` : null;
  const diff = current - previous;
  const percent = (diff / previous) * 100;
  return (percent >= 0 ? "+" : "") + percent.toFixed(1).replace(/\.0$/, "") + "%";
};

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

type DashboardRevenueRow = {
  date: string;
  revenuePaid: number;
  ordersPaid: number;
};

type DashboardRecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  totalAmount: number;
  currency: string | null;
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | string;
  paymentMethod: string;
  createdAt: Date;
  items?: Array<{ productName?: string | null } | null> | null;
};

export type DashboardRange = "daily" | "weekly" | "monthly";

export const adminDashboardService = {
  async getDashboardData(slug: string, range: DashboardRange = "monthly") {
    const store = await storeRepo.findAdminBySlug(slug);
    if (!store) return null;

    const to = new Date();
    let from: Date;
    let days: number;
    let interval: "day" | "hour" = "day";

    if (range === "daily") {
      from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
      days = 1;
      interval = "hour";
    } else if (range === "weekly") {
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      days = 7;
    } else {
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
      days = 30;
    }

    const prevTo = new Date(from.getTime());
    const prevFrom = new Date(prevTo.getTime() - (to.getTime() - from.getTime()));

    const [paidKpis, trafficTotals, prevKpis, prevTrafficTotals, productCount, revenueRaw, prevRevenueRaw, topProductsRaw, recentOrders] = await Promise.all([
      analyticsRepo.getKpiTotals(store, { from, to }),
      analyticsRepo.getTrafficTotals(store, { from, to }),
      analyticsRepo.getKpiTotals(store, { from: prevFrom, to: prevTo }),
      analyticsRepo.getTrafficTotals(store, { from: prevFrom, to: prevTo }),
      db.select({ value: count() }).from(products).where(and(eq(products.tenantId, store.tenantId), isNull(products.deletedAt))).then((r: { value: number }[]) => r[0]?.value ?? 0),
      analyticsRepo.getRevenueTimeseries(store, { from, to, interval }),
      analyticsRepo.getRevenueTimeseries(store, { from: prevFrom, to: prevTo, interval }),
      analyticsRepo.getTopProductsBySales(store, { from, to }),
      ordersRepo.findRecentOrders(store),
    ]);

    const revenueRows = revenueRaw as DashboardRevenueRow[];
    const prevRevenueRows = prevRevenueRaw as DashboardRevenueRow[];
    const recentOrderRows = recentOrders as DashboardRecentOrder[];

    const revenueTotalsByDate = new Map(revenueRows.map((row) => [row.date, row.revenuePaid]));
    const prevRevenueTotalsByDate = new Map(prevRevenueRows.map((row) => [row.date, row.revenuePaid]));
    const ordersTotalsByDate = new Map(revenueRows.map((row) => [row.date, row.ordersPaid]));

    const pointsCount = range === "daily" ? 24 : days + 1;
    const revenueSeries = Array.from({ length: pointsCount }).map((_, index) => {
      const day = new Date(from.getTime());
      if (range === "daily") {
        day.setHours(from.getHours() + index, 0, 0, 0);
      } else {
        day.setDate(from.getDate() + index);
      }
      const isoDate = day.toISOString().slice(0, range === "daily" ? 13 : 10).replace("T", " ");
      const formattedDate = range === "daily" ? `${day.getHours()}:00` : toChartDateLabel(isoDate.slice(0, 10));

      const repoKey = range === "daily" ? `${day.toISOString().slice(0, 10)} ${day.getHours().toString().padStart(2, "0")}:00` : day.toISOString().slice(0, 10);

      const prevDay = new Date(day.getTime() - (to.getTime() - from.getTime()));
      const prevRepoKey = range === "daily" ? `${prevDay.toISOString().slice(0, 10)} ${prevDay.getHours().toString().padStart(2, "0")}:00` : prevDay.toISOString().slice(0, 10);

      return {
        date: formattedDate,
        total: revenueTotalsByDate.get(repoKey) ?? 0,
        prevTotal: prevRevenueTotalsByDate.get(prevRepoKey) ?? 0,
      };
    });

    const ordersSeries = Array.from({ length: pointsCount }).map((_, index) => {
      const day = new Date(from.getTime());
      if (range === "daily") {
        day.setHours(from.getHours() + index, 0, 0, 0);
      } else {
        day.setDate(from.getDate() + index);
      }
      const formattedDate = range === "daily" ? `${day.getHours()}:00` : toChartDateLabel(day.toISOString().slice(0, 10));
      const repoKey = range === "daily" ? `${day.toISOString().slice(0, 10)} ${day.getHours().toString().padStart(2, "0")}:00` : day.toISOString().slice(0, 10);

      return {
        date: formattedDate,
        total: ordersTotalsByDate.get(repoKey) ?? 0,
      };
    });

    const currency = store.defaultCurrency || "UGX";

    const balance = paidKpis.revenuePaid * 0.97;
    const prevBalance = prevKpis.revenuePaid * 0.97;
    const paidOut = Math.max(0, balance - (paidKpis.ordersPaid * 1200));
    const prevPaidOut = Math.max(0, prevBalance - (prevKpis.ordersPaid * 1200));

    const stats = [
      {
        label: "Revenue",
        value: paidKpis.revenuePaid,
        changeLabel: trendLabel(paidKpis.revenuePaid, prevKpis.revenuePaid),
        changeTone: trendTone(paidKpis.revenuePaid, prevKpis.revenuePaid),
      },
      {
        label: "Balance",
        value: balance,
        changeLabel: trendLabel(balance, prevBalance),
        changeTone: trendTone(balance, prevBalance),
      },
      {
        label: "Paid out",
        value: paidOut,
        changeLabel: trendLabel(paidOut, prevPaidOut),
        changeTone: trendTone(paidOut, prevPaidOut),
      },
      {
        label: "Paid Orders",
        value: paidKpis.ordersPaid,
        isNumeric: true,
        changeLabel: trendLabel(paidKpis.ordersPaid, prevKpis.ordersPaid),
        changeTone: trendTone(paidKpis.ordersPaid, prevKpis.ordersPaid),
      },
      {
        label: "Store Visits",
        value: trafficTotals.visits,
        isNumeric: true,
        changeLabel: trendLabel(trafficTotals.visits, prevTrafficTotals.visits),
        changeTone: trendTone(trafficTotals.visits, prevTrafficTotals.visits),
      }
    ];

    const isVendly = store.slug === "vendly";

    const transactionRows = recentOrderRows.map((o, index: number) => {
      const maskedCustomerName = isVendly ? `Customer ${index + 1}` : o.customerName;
      const itemLabel =
        o.items?.length === 1
          ? o.items[0]?.productName
          : o.items?.length
            ? `${o.items.length} items`
            : "â€”";

      const status =
        o.paymentStatus === "paid"
          ? "Completed"
          : o.paymentStatus === "failed"
            ? "Failed"
            : "Pending";

      return {
        id: o.orderNumber,
        actualId: o.id,
        customer: maskedCustomerName || "â€”",
        product: itemLabel || "â€”",
        amount: formatCurrency(o.totalAmount, o.currency || currency),
        status: status as "Completed" | "Failed" | "Pending",
        paymentMethod: o.paymentMethod,
        date: new Date(o.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      };
    });

    const breakdown = {
      grossSales: paidKpis.grossSales,
      discounts: paidKpis.discounts,
      netSales: paidKpis.grossSales - paidKpis.discounts - paidKpis.refunds,
      totalSales: (paidKpis.grossSales - paidKpis.discounts - paidKpis.refunds) + paidKpis.shippingCharges + paidKpis.taxes,
      revenue: paidKpis.revenuePaid,
      balance,
      paidOut,
    };

    return {
      store,
      stats,
      traffic: trafficTotals,
      productCount,
      revenueSeries,
      ordersSeries,
      breakdown,
      topProducts: topProductsRaw.map((p: any) => ({ product: p.product, sales: p.sales })),
      transactionRows,
      currency,
    };
  },
};
