import { NextRequest } from "next/server";
import { db, orders, products, and, eq, isNull, desc, lt } from "@shopvendly/db";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { type ActivityEvent } from "@/modules/admin/models/activity";
import { storeRepo } from "@/modules/storefront/repo/store-repo";
import { jsonSuccess, jsonError, isDemoStore, getOptionalSession } from "@/shared/lib/api/response-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) return jsonError("Store ID is required", 400);

    const store = await storeRepo.findById(storeId);
    if (!store) return jsonError("Store not found", 404);

    if (!session?.user && !isDemoStore(store.slug)) return jsonError("Unauthorized", 401);

    let tenantId = store.tenantId;
    if (session?.user) {
      const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
      if (!access.store || !access.isAuthorized) return jsonError("Forbidden", 403);
      tenantId = access.store.tenantId;
    }

    const [recentOrders, lowStockProducts] = await Promise.all([
      db.query.orders.findMany({
        where: and(eq(orders.tenantId, tenantId), eq(orders.storeId, storeId), isNull(orders.deletedAt)),
        orderBy: [desc(orders.createdAt)],
        limit: 15,
        with: { items: { columns: { productName: true, productImage: true } } },
      }),
      db.query.products.findMany({
        where: and(
          eq(products.tenantId, tenantId),
          eq(products.storeId, storeId),
          isNull(products.deletedAt),
          lt(products.quantity, 5),
        ),
        limit: 5,
      }),
    ]);

    const events: ActivityEvent[] = [];

    for (const o of recentOrders) {
      events.push({
        id: `order_placed_${o.id}`,
        type: "order_placed",
        title: "New Order Placed",
        description: `Order ${o.orderNumber} for ${o.customerName || "a customer"}`,
        timestamp: o.createdAt.toISOString(),
        actor: { name: o.customerName || "Customer" },
        metadata: { orderId: o.id, orderNumber: o.orderNumber, amount: o.totalAmount, currency: o.currency },
      });

      if (o.paymentStatus === "paid") {
        events.push({
          id: `payment_received_${o.id}`,
          type: "payment_received",
          title: "Payment Received",
          description: `Payment for order ${o.orderNumber} was successful`,
          timestamp: o.updatedAt.toISOString(),
          metadata: { orderId: o.id, amount: o.totalAmount, currency: o.currency },
        });
      } else if (o.paymentStatus === "failed") {
        events.push({
          id: `payment_failed_${o.id}`,
          type: "payment_failed",
          title: "Payment Failed",
          description: `Payment for order ${o.orderNumber} failed`,
          timestamp: o.updatedAt.toISOString(),
          metadata: { orderId: o.id },
        });
      }
    }

    for (const p of lowStockProducts) {
      events.push({
        id: `low_stock_${p.id}`,
        type: "low_stock",
        title: "Low Stock Alert",
        description: `${p.productName} is running low (${p.quantity} left)`,
        timestamp: p.updatedAt.toISOString(),
        metadata: { productId: p.id, quantity: p.quantity },
      });
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return jsonSuccess({ events });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return jsonError("Failed to fetch activity", 500);
  }
}
