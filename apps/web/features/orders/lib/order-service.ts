import { db } from "@shopvendly/db/db";
import { orders, orderItems, products, stores } from "@shopvendly/db/schema";
import { eq, and, isNull, desc, sql, like, or, inArray } from "@shopvendly/db";
import type { CreateOrderInput, UpdateOrderStatusInput, OrderFilters, OrderWithItems, OrderStats } from "../models/order-models";

type ProductWithMedia = (typeof products.$inferSelect) & {
    media?: Array<{ media?: { blobUrl?: string | null } | null; sortOrder?: number | null } | null>;
};

/**
 * Order Service for serverless environment
 */
export const orderService = {
    /**
     * Create a new order from storefront
     */
    async createOrder(storeSlug: string, input: CreateOrderInput): Promise<OrderWithItems> {
        // Find store by slug
        const store = await db.query.stores.findFirst({
            where: and(eq(stores.slug, storeSlug), isNull(stores.deletedAt)),
        });

        if (!store) {
            throw new Error("Store not found");
        }

        // Get product details
        const productIds = input.items.map((item) => item.productId);
        const productList = await db.query.products.findMany({
            where: and(
                inArray(products.id, productIds),
                isNull(products.deletedAt)
            ),
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

        // Build product map for quick lookup
        const productMap = new Map(productList.map((p) => [p.id, p]));

        // Calculate order totals and build items
        let subtotal = 0;
        const currency = productList[0]?.currency || "UGX";

        const orderItemsData = input.items.map((item) => {
            const product = productMap.get(item.productId) as ProductWithMedia | undefined;
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

        // Generate order number
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

        const items = orderItemsData.map((item) => ({
            tenantId: store.tenantId,
            orderId: order.id,
            ...item,
        }));

        await db.insert(orderItems).values(items);

        // Fetch complete order with items
        const completeOrder = await db.query.orders.findFirst({
            where: eq(orders.id, order.id),
            with: {
                items: true,
            },
        });

        if (!completeOrder) {
            throw new Error("Failed to create order");
        }

        return completeOrder as OrderWithItems;
    },

    /**
     * Get order by ID
     */
    async getOrder(orderId: string, tenantId: string): Promise<OrderWithItems | null> {
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                eq(orders.tenantId, tenantId),
                isNull(orders.deletedAt)
            ),
            with: {
                items: true,
            },
        });
        return order as OrderWithItems | null;
    },

    /**
     * List orders for a tenant
     */
    async listOrders(tenantId: string, filters: OrderFilters): Promise<{
        orders: OrderWithItems[];
        total: number;
        page: number;
        limit: number;
    }> {
        const { status, paymentStatus, page, limit, search } = filters;
        const offset = (page - 1) * limit;

        const conditions = [
            eq(orders.tenantId, tenantId),
            isNull(orders.deletedAt),
        ];

        if (status) {
            conditions.push(eq(orders.status, status));
        }

        if (paymentStatus) {
            conditions.push(eq(orders.paymentStatus, paymentStatus));
        }

        if (search) {
            conditions.push(
                or(
                    like(orders.orderNumber, `%${search}%`),
                    like(orders.customerName, `%${search}%`),
                    like(orders.customerEmail, `%${search}%`)
                )!
            );
        }

        const whereClause = and(...conditions);

        const orderList = await db.query.orders.findMany({
            where: whereClause,
            with: {
                items: true,
            },
            orderBy: [desc(orders.createdAt)],
            limit,
            offset,
        });

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(orders)
            .where(whereClause);

        return {
            orders: orderList as OrderWithItems[],
            total: count,
            page,
            limit,
        };
    },

    /**
     * Update order status
     */
    async updateOrderStatus(orderId: string, tenantId: string, input: UpdateOrderStatusInput) {
        const order = await this.getOrder(orderId, tenantId);
        if (!order) {
            throw new Error("Order not found");
        }

        const [updated] = await db
            .update(orders)
            .set({
                ...input,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    isNull(orders.deletedAt)
                )
            )
            .returning();

        return updated;
    },

    /**
     * Get order statistics
     */
    async getOrderStats(tenantId: string): Promise<OrderStats> {
        const store = await db.query.stores.findFirst({
            where: and(eq(stores.tenantId, tenantId), isNull(stores.deletedAt)),
            columns: { defaultCurrency: true },
        });

        const [revenueResult] = await db
            .select({
                total: sql<number>`COALESCE(SUM(total_amount), 0)::int`,
                count: sql<number>`count(*)::int`,
            })
            .from(orders)
            .where(
                and(
                    eq(orders.tenantId, tenantId),
                    eq(orders.paymentStatus, "paid"),
                    isNull(orders.deletedAt)
                )
            );

        const [pendingResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(orders)
            .where(
                and(
                    eq(orders.tenantId, tenantId),
                    eq(orders.status, "pending"),
                    isNull(orders.deletedAt)
                )
            );

        const [refundedResult] = await db
            .select({
                total: sql<number>`COALESCE(SUM(total_amount), 0)::int`,
            })
            .from(orders)
            .where(
                and(
                    eq(orders.tenantId, tenantId),
                    eq(orders.paymentStatus, "refunded"),
                    isNull(orders.deletedAt)
                )
            );

        const [totalCountResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(orders)
            .where(
                and(
                    eq(orders.tenantId, tenantId),
                    isNull(orders.deletedAt)
                )
            );

        return {
            totalRevenue: revenueResult?.total || 0,
            revenueChange: "+0% from last month",
            orderCount: totalCountResult?.count || 0,
            countChange: "+0% from last month",
            pendingCount: pendingResult?.count || 0,
            pendingChange: "+0% from last month",
            refundedAmount: refundedResult?.total || 0,
            refundedChange: "+0% from last month",
            currency: store?.defaultCurrency || "UGX",
        };
    },
};
