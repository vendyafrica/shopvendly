import { db, orders, tenantMemberships, eq, and, isNull, desc } from "@shopvendly/db";

export const ordersRepo = {
  async findTenantIdByUserId(userId: string) {
    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, userId),
    });

    return membership?.tenantId ?? null;
  },

  async findRecentOrders(store: { id: string; tenantId: string }, limit = 8) {
    return db.query.orders.findMany({
      where: and(eq(orders.tenantId, store.tenantId), eq(orders.storeId, store.id), isNull(orders.deletedAt)),
      with: { items: { columns: { productName: true } } },
      orderBy: [desc(orders.createdAt)],
      limit,
      columns: {
        id: true,
        orderNumber: true,
        customerName: true,
        paymentStatus: true,
        paymentMethod: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
      },
    });
  },
};
