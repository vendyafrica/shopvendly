import {
  TTL,
  and,
  cacheKeys,
  db,
  eq,
  inArray,
  invalidateCache,
  isNull,
  like,
  or,
  sql,
  withCache,
} from "@vendly/db";
import { orders, orderItems, products, stores, tenants } from "@vendly/db";
import { normalizePhoneToE164 } from "../shared/utils/phone";
import { z } from "zod";

type ProductWithMedia = (typeof products.$inferSelect) & {
  media?: Array<{ media?: { blobUrl?: string | null } | null; sortOrder?: number | null } | null>;
};

export const orderItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const createOrderSchema = z.object({
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  paymentMethod: z.enum(["card", "mpesa", "paystack", "cash_on_delivery"]).default("cash_on_delivery"),
  notes: z.string().optional(),
  items: z.array(orderItemInputSchema).min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "ready", "out_for_delivery", "completed", "cancelled", "refunded"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  paymentMethod: z.enum(["card", "mpesa", "paystack", "cash_on_delivery"]).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export type OrderWithItems = Awaited<ReturnType<typeof orderService.getOrderById>>;

export const orderService = {
  async createOrder(storeSlug: string, input: CreateOrderInput) {
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.slug, storeSlug), isNull(stores.deletedAt)),
    });

    if (!store) {
      throw new Error("Store not found");
    }

    const productIds = input.items.map((i) => i.productId);
    const productList = await db.query.products.findMany({
      where: and(inArray(products.id, productIds), isNull(products.deletedAt)),
      with: {
        media: {
          with: { media: true },
          orderBy: (media, { asc }) => [asc(media.sortOrder)],
          limit: 1,
        },
      },
    });

    if (productList.length !== productIds.length) {
      throw new Error("One or more products not found");
    }

    const productMap = new Map(productList.map((p) => [p.id, p as unknown as ProductWithMedia]));

    let subtotal = 0;
    const currency = productList[0]?.currency || "UGX";

    const orderItemsData = input.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const totalPrice = product.priceAmount * item.quantity;
      subtotal += totalPrice;

      const productImage = product.media?.[0]?.media?.blobUrl || undefined;

      return {
        productId: product.id,
        productName: product.productName,
        productImage,
        quantity: item.quantity,
        unitPrice: product.priceAmount,
        totalPrice,
        currency: product.currency,
      };
    });

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.storeId, store.id));

    const orderNumber = `ORD-${((countResult?.count || 0) + 1).toString().padStart(4, "0")}`;

    const totalAmount = subtotal;

    const [order] = await db
      .insert(orders)
      .values({
        tenantId: store.tenantId,
        storeId: store.id,
        orderNumber,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        paymentMethod: input.paymentMethod,
        paymentStatus: "pending",
        status: "pending",
        notes: input.notes,
        subtotal,
        totalAmount,
        currency,
      })
      .returning();

    await db.insert(orderItems).values(
      orderItemsData.map((i) => ({
        tenantId: store.tenantId,
        orderId: order.id,
        ...i,
      }))
    );

    const completeOrder = await db.query.orders.findFirst({
      where: eq(orders.id, order.id),
      with: { items: true, store: true },
    });

    if (!completeOrder) {
      throw new Error("Failed to create order");
    }

    void invalidateCache(cacheKeys.orders.list(store.tenantId));
    void invalidateCache(cacheKeys.orders.stats(store.tenantId));

    return completeOrder;
  },

  async getOrderById(orderId: string) {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
      with: { items: true, store: true },
    });
    return order;
  },

  async listOrdersForTenant(tenantId: string) {
    return withCache(
      cacheKeys.orders.list(tenantId),
      async () => {
        const list = await db.query.orders.findMany({
          where: and(eq(orders.tenantId, tenantId), isNull(orders.deletedAt)),
          with: { items: true, store: true },
          orderBy: (o, { desc }) => [desc(o.createdAt)],
        });
        return list;
      },
      TTL.SHORT
    );
  },

  async updateOrderStatus(orderId: string, tenantId: string, input: UpdateOrderStatusInput) {
    const existing = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId), isNull(orders.deletedAt)),
    });

    if (!existing) {
      throw new Error("Order not found");
    }

    const [updated] = await db
      .update(orders)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId), isNull(orders.deletedAt)))
      .returning();

    void invalidateCache(cacheKeys.orders.list(tenantId));
    void invalidateCache(cacheKeys.orders.stats(tenantId));

    return updated;
  },

  async getTenantPhoneByStoreSlug(storeSlug: string) {
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.slug, storeSlug), isNull(stores.deletedAt)),
      columns: { tenantId: true },
    });

    if (!store) {
      throw new Error("Store not found");
    }

    const tenant = await db.query.tenants.findFirst({
      where: and(eq(tenants.id, store.tenantId), isNull(tenants.deletedAt)),
      columns: { phoneNumber: true },
    });

    return tenant?.phoneNumber || null;
  },

  async getTenantPhoneByTenantId(tenantId: string) {
    const tenant = await db.query.tenants.findFirst({
      where: and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)),
      columns: { phoneNumber: true },
    });

    return tenant?.phoneNumber || null;
  },

  async getTenantIdByPhoneNumber(phoneNumber: string) {
    const variants = new Set<string>();
    const trimmed = phoneNumber.trim();
    if (trimmed) variants.add(trimmed);

    const normalized = normalizePhoneToE164(trimmed, {
      defaultCountryCallingCode: process.env.DEFAULT_COUNTRY_CALLING_CODE || "256",
    });
    if (normalized) {
      variants.add(normalized);
      if (normalized.startsWith("+")) variants.add(normalized.slice(1));
    }

    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly) {
      variants.add(digitsOnly);
      variants.add(`+${digitsOnly}`);
      if (digitsOnly.startsWith("0") && digitsOnly.length > 1) {
        variants.add(digitsOnly.slice(1));
      }
    }

    const list = Array.from(variants).filter(Boolean);
    if (!list.length) return null;

    const suffixes = new Set<string>();
    if (digitsOnly.length >= 9) suffixes.add(digitsOnly.slice(-9));
    if (digitsOnly.length >= 10) suffixes.add(digitsOnly.slice(-10));
    if (digitsOnly.startsWith("0") && digitsOnly.length > 1) suffixes.add(digitsOnly.slice(1));

    const conditions = [inArray(tenants.phoneNumber, list), ...Array.from(suffixes).map((suffix) => like(tenants.phoneNumber, `%${suffix}`))];

    const tenant = await db.query.tenants.findFirst({
      where: and(conditions.length > 1 ? or(...conditions) : conditions[0], isNull(tenants.deletedAt)),
      columns: { id: true },
    });

    return tenant?.id || null;
  },

  async getOrderByOrderNumberForTenant(tenantId: string, orderNumber: string) {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.tenantId, tenantId), eq(orders.orderNumber, orderNumber), isNull(orders.deletedAt)),
      with: { items: true, store: true },
    });
    return order;
  },

  async getLatestOrderForTenantByStatus(tenantId: string, statuses: Array<"pending" | "processing" | "ready" | "out_for_delivery" | "completed" | "cancelled" | "refunded">) {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.tenantId, tenantId), inArray(orders.status, statuses), isNull(orders.deletedAt)),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      with: { items: true, store: true },
    });

    return order;
  },

  async getLatestOrderByCustomerPhone(phone: string, paymentStatuses: Array<"pending" | "paid" | "failed" | "refunded">) {
    const variants = new Set<string>();
    const trimmed = phone.trim();
    if (trimmed) variants.add(trimmed);

    const normalized = normalizePhoneToE164(trimmed, {
      defaultCountryCallingCode: process.env.DEFAULT_COUNTRY_CALLING_CODE || "256",
    });
    if (normalized) variants.add(normalized);
    if (normalized?.startsWith("+")) variants.add(normalized.slice(1));

    const list = Array.from(variants);
    if (!list.length) return null;

    const order = await db.query.orders.findFirst({
      where: and(
        inArray(orders.customerPhone, list),
        inArray(orders.paymentStatus, paymentStatuses),
        isNull(orders.deletedAt),
      ),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      with: { items: true, store: true },
    });

    return order || null;
  },

  async updateOrderStatusByOrderId(orderId: string, input: UpdateOrderStatusInput) {
    const [updated] = await db
      .update(orders)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), isNull(orders.deletedAt)))
      .returning();

    return updated;
  },
};
