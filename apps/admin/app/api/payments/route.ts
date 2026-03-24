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
                storeSlug: stores.slug,
                customerPhone: orders.customerPhone,
            })
            .from(orders)
            .leftJoin(stores, eq(orders.storeId, stores.id))
            .orderBy(desc(orders.createdAt));

        const orderIds = results.map((row) => row.id);
        
        // Fetch all related collections for these orders
        const collectionRows = orderIds.length
            ? await db
                .select({
                    orderId: collectoPaymentCollections.orderId,
                    payerPhone: collectoPaymentCollections.payerPhone,
                    createdAt: collectoPaymentCollections.createdAt,
                })
                .from(collectoPaymentCollections)
                .where(inArray(collectoPaymentCollections.orderId, orderIds))
                .orderBy(desc(collectoPaymentCollections.createdAt))
            : [];

        // Map orderId -> latest payerPhone
        const phoneMap = new Map<string, string>();
        for (const row of collectionRows) {
            if (row.payerPhone && !phoneMap.has(row.orderId)) {
                phoneMap.set(row.orderId, row.payerPhone);
            }
        }

        const payments = results.map((row) => ({
            id: row.id,
            provider: row.provider,
            customerNumber: phoneMap.get(row.id) || row.customerPhone || null,
            status: row.status.toUpperCase(),
            amount: row.amount,
            currency: row.currency,
            createdAt: row.createdAt,
            orderNumber: row.orderNumber,
            storeName: row.storeName || null,
            storeSlug: row.storeSlug || null,
        }));

        return NextResponse.json(payments);
    } catch (error) {
        console.error("Payments API Error:", error);
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}
