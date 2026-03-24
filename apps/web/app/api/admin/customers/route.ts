import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db, orders, and, eq, isNull, sql, desc } from "@shopvendly/db";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeRepo } from "@/repo/store-repo";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const store = await storeRepo.findById(storeId);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const isDemoStore = store.slug === "vendly";

    if (!session?.user && !isDemoStore) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tenantId = store.tenantId;

    if (session?.user) {
      const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
      if (!access.store || !access.isAuthorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      tenantId = access.store.tenantId;
    }

    const now = new Date();
    const newThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const churnThreshold = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const rowsAgg = await db
      .select({
        email: orders.customerEmail,
        name: sql<string>`MAX(${orders.customerName})`,
        orders: sql<number>`COALESCE(COUNT(*), 0)::int`,
        totalSpend: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        lastOrderAt: sql<Date>`MAX(${orders.createdAt})`,
        firstOrderAt: sql<Date>`MIN(${orders.createdAt})`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.storeId, storeId),
          isNull(orders.deletedAt)
        )
      )
      .groupBy(orders.customerEmail)
      .orderBy(desc(sql`MAX(${orders.createdAt})`));

    const currency = store.defaultCurrency || "USD";

    const isVendly = store.slug === "vendly";

    let demoCustomerIndex = 0;

    const customers = rowsAgg.map((r) => {
      const last = r.lastOrderAt ? new Date(r.lastOrderAt) : null;
      const first = r.firstOrderAt ? new Date(r.firstOrderAt) : null;

      const status =
        r.orders > 1
          ? "Returning"
          : first && first >= newThreshold
            ? "New"
            : last && last < churnThreshold
              ? "Churn Risk"
              : "Active";

      let name = r.name || "—";
      let email = r.email || "—";

      if (isVendly) {
        demoCustomerIndex += 1;
        name = `Customer ${demoCustomerIndex}`;
        email = `customer${demoCustomerIndex}@example.com`;
      }

      return {
        name,
        email,
        orders: r.orders,
        totalSpend: Number(r.totalSpend || 0),
        currency,
        lastOrder: (last ?? new Date(0)).toISOString(),
        status,
      };
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
