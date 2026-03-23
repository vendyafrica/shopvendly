import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db, orders, products, and, eq, isNull, desc, lt } from "@shopvendly/db";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { type ActivityEvent } from "@/modules/admin/models/activity";
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

    // 1. Fetch recent orders
    const recentOrders = await db.query.orders.findMany({
      where: and(eq(orders.tenantId, tenantId), eq(orders.storeId, storeId), isNull(orders.deletedAt)),
      orderBy: [desc(orders.createdAt)],
      limit: 15,
      with: {
          items: {
              columns: {
                  productName: true,
                  productImage: true,
              }
          }
      }
    });

    // 2. Fetch low stock products
    const lowStockProducts = await db.query.products.findMany({
      where: and(
          eq(products.tenantId, tenantId), 
          eq(products.storeId, storeId), 
          isNull(products.deletedAt),
          lt(products.quantity, 5)
      ),
      limit: 5,
    });

    const events: ActivityEvent[] = [];

    // Map orders to events
    recentOrders.forEach((o) => {
      // Order Placed Event
      events.push({
        id: `order_placed_${o.id}`,
        type: "order_placed",
        title: "New Order Placed",
        description: `Order ${o.orderNumber} for ${o.customerName || "a customer"}`,
        timestamp: o.createdAt.toISOString(),
        actor: {
          name: o.customerName || "Customer",
        },
        metadata: {
          orderId: o.id,
          orderNumber: o.orderNumber,
          amount: o.totalAmount,
          currency: o.currency,
        }
      });

      // Payment Events
      if (o.paymentStatus === "paid") {
        events.push({
          id: `payment_received_${o.id}`,
          type: "payment_received",
          title: "Payment Received",
          description: `Payment for order ${o.orderNumber} was successful`,
          timestamp: o.updatedAt.toISOString(),
          metadata: {
            orderId: o.id,
            amount: o.totalAmount,
            currency: o.currency,
          }
        });
      } else if (o.paymentStatus === "failed") {
        events.push({
          id: `payment_failed_${o.id}`,
          type: "payment_failed",
          title: "Payment Failed",
          description: `Payment for order ${o.orderNumber} failed`,
          timestamp: o.updatedAt.toISOString(),
          metadata: {
            orderId: o.id,
          }
        });
      }
    });

    // Map low stock products to events
    lowStockProducts.forEach((p) => {
      events.push({
        id: `low_stock_${p.id}`,
        type: "low_stock",
        title: "Low Stock Alert",
        description: `${p.productName} is running low (${p.quantity} left)`,
        timestamp: p.updatedAt.toISOString(),
        metadata: {
          productId: p.id,
          quantity: p.quantity,
        }
      });
    });

    // Sort all events by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
