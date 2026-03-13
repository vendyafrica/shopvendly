import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";
import { db } from "@shopvendly/db/db";
import { collectoPaymentCollections, orders, stores } from "@shopvendly/db/schema";
import { desc, eq, inArray } from "@shopvendly/db";

export async function GET() {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    try {
        const results = await db
            .select({
                id: orders.id,
                provider: orders.paymentMethod,
                status: orders.paymentStatus,
                amount: orders.totalAmount,
                currency: orders.currency,
                createdAt: orders.createdAt,
                orderNumber: orders.orderNumber,
                storeName: stores.name,
                customerPhone: orders.customerPhone,
            })
            .from(orders)
            .leftJoin(stores, eq(orders.storeId, stores.id))
            .orderBy(desc(orders.createdAt));

        const orderIds = results.map((row) => row.id);
        const collectionRows = orderIds.length
            ? await db.query.collectoPaymentCollections.findMany({
                where: inArray(collectoPaymentCollections.orderId, orderIds),
                orderBy: (table, helpers) => [helpers.desc(table.createdAt)],
            })
            : [];

        const latestCollectionsByOrderId = new Map<string, (typeof collectionRows)[number]>();
        for (const row of collectionRows) {
            if (!latestCollectionsByOrderId.has(row.orderId)) {
                latestCollectionsByOrderId.set(row.orderId, row);
            }
        }

        const payments = results.map((row) => ({
            id: row.id,
            provider: row.provider,
            payerPhone: latestCollectionsByOrderId.get(row.id)?.payerPhone || row.customerPhone || null,
            status: row.status.toUpperCase(),
            amount: row.amount,
            currency: row.currency,
            createdAt: row.createdAt,
            orderNumber: row.orderNumber,
            storeName: row.storeName || null,
        }));

        return NextResponse.json(payments);
    } catch (error) {
        console.error("Payments API Error:", error);
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}
