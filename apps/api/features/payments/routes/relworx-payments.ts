import { Router } from "express";
import type { Request, Response, Router as ExpressRouter } from "express";
import { z } from "zod";
import { and, db, eq, isNull, orders, stores, tenants } from "@shopvendly/db";
import {
    requestPaymentFromCustomer,
    sendPaymentToMerchant,
    checkPaymentStatus,
    getTransactions,
    generateRelworxReference,
} from "../services/relworx-service.js";
import { handlePaidOrderTransition } from "../services/payment-order-transition.js";
import { normalizePhoneToE164 } from "../../../shared/utils/phone.js";

export const relworxPaymentsRouter: ExpressRouter = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function assertStoreAndOrder(storeSlug: string, orderId: string) {
    const store = await db.query.stores.findFirst({
        where: and(eq(stores.slug, storeSlug), isNull(stores.deletedAt)),
        columns: { id: true, tenantId: true, name: true, defaultCurrency: true },
    });
    if (!store) throw Object.assign(new Error("Store not found"), { status: 404 });

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.storeId, store.id), isNull(orders.deletedAt)),
    });
    if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });

    return { store, order };
}

function normRelworxStatus(status: string): "pending" | "paid" | "failed" {
    const s = status.toLowerCase();
    if (s === "success") return "paid";
    if (s === "failed" || s === "cancelled") return "failed";
    return "pending";
}

async function triggerMerchantPayout(orderId: string) {
    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
        columns: { id: true, tenantId: true, orderNumber: true, totalAmount: true, currency: true },
    });

    if (!order) return;

    const tenant = await db.query.tenants.findFirst({
        where: and(eq(tenants.id, order.tenantId), isNull(tenants.deletedAt)),
        columns: { phoneNumber: true },
    });

    if (!tenant?.phoneNumber) {
        console.warn("[Relworx Payout] Skipping payout. Tenant has no phone number", { orderId: order.id, tenantId: order.tenantId });
        return;
    }

    const msisdn = normalizePhoneToE164(tenant.phoneNumber, {
        defaultCountryCallingCode: process.env.DEFAULT_COUNTRY_CALLING_CODE || "256",
    });

    if (!msisdn) {
        console.warn("[Relworx Payout] Skipping payout. Could not normalize merchant phone", { orderId: order.id, rawPhone: tenant.phoneNumber });
        return;
    }

    const result = await sendPaymentToMerchant({
        msisdn,
        amount: order.totalAmount,
        currency: order.currency,
        reference: generateRelworxReference("VND"),
        description: `Vendor payout for order ${order.orderNumber}`,
    });

    console.log("[Relworx Payout] Merchant payout initiated", {
        orderId: order.id,
        internalReference: result.internal_reference,
        msisdn,
        amount: order.totalAmount,
        currency: order.currency,
    });
}

async function processPaidOrder(orderId: string) {
    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
        columns: { id: true, paymentStatus: true },
    });

    if (!order || order.paymentStatus === "paid") {
        return;
    }

    await handlePaidOrderTransition({ orderId: order.id, paymentMethod: "relworx" });
    await triggerMerchantPayout(order.id);
}

// ---------------------------------------------------------------------------
// POST /api/storefront/:slug/payments/relworx/initiate
// Customer's mobile money is charged → money goes to Vendly's Relworx account.
// ---------------------------------------------------------------------------
const initiateSchema = z.object({
    orderId: z.string().uuid(),
    msisdn: z.string().min(7, "Phone number required"),
});

relworxPaymentsRouter.post("/storefront/:slug/payments/relworx/initiate", async (req, res, next) => {
    try {
        const { slug } = req.params;
        const body = initiateSchema.parse(req.body);

        const { order } = await assertStoreAndOrder(slug, body.orderId);

        // Don't re-initiate if already paid
        if (order.paymentStatus === "paid") {
            return res.status(200).json({ internalReference: order.paymentReference, paymentStatus: "paid" });
        }

        const reference = generateRelworxReference("RLX");

        const result = await requestPaymentFromCustomer({
            msisdn: body.msisdn,
            amount: order.totalAmount,
            currency: order.currency,
            reference,
            description: `Order ${order.orderNumber} via Vendly`,
        });

        // Store the Relworx internal_reference on the order
        await db
            .update(orders)
            .set({ paymentReference: result.internal_reference, paymentStatus: "pending", updatedAt: new Date() })
            .where(and(eq(orders.id, order.id), isNull(orders.deletedAt)));

        return res.status(202).json({
            internalReference: result.internal_reference,
            orderId: order.id,
            paymentStatus: "pending",
            message: result.message,
        });
    } catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// GET /api/storefront/:slug/payments/relworx/status/:orderId
// Frontend polls this to check if payment is complete.
// ---------------------------------------------------------------------------
relworxPaymentsRouter.get("/storefront/:slug/payments/relworx/status/:orderId", async (req, res, next) => {
    try {
        const { slug, orderId } = req.params;
        const { order } = await assertStoreAndOrder(slug, orderId);

        if (!order.paymentReference) {
            return res.status(200).json({ paymentStatus: order.paymentStatus, orderId });
        }

        // Fetch latest from Relworx
        const relworxStatus = await checkPaymentStatus(order.paymentReference);
        const normalized = normRelworxStatus(relworxStatus.request_status || relworxStatus.status || "");

        if (normalized === "paid" && order.paymentStatus !== "paid") {
            await processPaidOrder(order.id);
        } else if (normalized === "failed" && order.paymentStatus !== "failed") {
            await db
                .update(orders)
                .set({ paymentStatus: "failed", updatedAt: new Date() })
                .where(and(eq(orders.id, order.id), isNull(orders.deletedAt)));
        }

        return res.status(200).json({ paymentStatus: normalized, orderId, internalReference: order.paymentReference });
    } catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// POST /api/webhooks/relworx
// Relworx fires this when a payment completes.
// ---------------------------------------------------------------------------
async function handleRelworxWebhook(req: Request, res: Response) {
    try {
        const payload = req.body;
        const internalRef = payload?.internal_reference as string | undefined;
        const status = payload?.status as string | undefined;

        console.log("[Relworx Webhook] Incoming", { internalRef, status });

        if (internalRef && status) {
            const normalized = normRelworxStatus(status);

            if (normalized === "paid") {
                // Find the order by paymentReference
                const order = await db.query.orders.findFirst({
                    where: and(eq(orders.paymentReference, internalRef), isNull(orders.deletedAt)),
                });

                if (order && order.paymentStatus !== "paid") {
                    await processPaidOrder(order.id);
                    console.log("[Relworx Webhook] Order marked paid:", order.id);
                }
            } else if (normalized === "failed") {
                const order = await db.query.orders.findFirst({
                    where: and(eq(orders.paymentReference, internalRef), isNull(orders.deletedAt)),
                });
                if (order && order.paymentStatus !== "paid") {
                    await db
                        .update(orders)
                        .set({ paymentStatus: "failed", updatedAt: new Date() })
                        .where(eq(orders.id, order.id));
                }
            }
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("[Relworx Webhook] Error:", err);
        return res.status(200).json({ ok: true }); // Always 200 to prevent retries on our bugs
    }
}

relworxPaymentsRouter.post("/webhooks/relworx", handleRelworxWebhook);

// ---------------------------------------------------------------------------
// GET /api/admin/relworx/transactions  (super-admin)
// Fetch all Relworx transactions for Vendly's account.
// ---------------------------------------------------------------------------
relworxPaymentsRouter.get("/admin/relworx/transactions", async (req, res, next) => {
    try {
        // Basic internal key guard — the admin Next.js app sends this
        const authHeader = req.headers.authorization;
        const internalKey = process.env.INTERNAL_API_KEY;
        if (internalKey && authHeader !== `Bearer ${internalKey}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const transactions = await getTransactions();
        return res.status(200).json({ transactions });
    } catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// POST /api/admin/relworx/send-payment  (super-admin)
// Send a payout from Vendly's account to a merchant's phone number.
// ---------------------------------------------------------------------------
const sendPaymentSchema = z.object({
    tenantId: z.string().uuid().optional(),
    msisdn: z.string().min(7).optional(),
    amount: z.number().positive(),
    currency: z.string().length(3),
    description: z.string().optional(),
    orderId: z.string().uuid().optional(),
}).refine((value) => Boolean(value.msisdn || value.tenantId), {
    message: "Either msisdn or tenantId is required",
    path: ["msisdn"],
});

relworxPaymentsRouter.post("/admin/relworx/send-payment", async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const internalKey = process.env.INTERNAL_API_KEY;
        if (internalKey && authHeader !== `Bearer ${internalKey}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const body = sendPaymentSchema.parse(req.body);

        // If tenantId provided, resolve phone from tenant record
        let msisdn = body.msisdn;
        if (body.tenantId && !body.msisdn) {
            const tenant = await db.query.tenants.findFirst({
                where: and(eq(tenants.id, body.tenantId), isNull(tenants.deletedAt)),
                columns: { phoneNumber: true },
            });
            if (!tenant?.phoneNumber) throw new Error("Merchant has no phone number on file");
            msisdn = tenant.phoneNumber;
        }

        if (!msisdn) {
            return res.status(400).json({ error: "Merchant phone number is required" });
        }

        const reference = generateRelworxReference("PAY");

        const result = await sendPaymentToMerchant({
            msisdn,
            amount: body.amount,
            currency: body.currency,
            reference,
            description: body.description || "Merchant payout from Vendly",
        });

        return res.status(202).json({
            success: true,
            internalReference: result.internal_reference,
            message: result.message,
        });
    } catch (err) {
        next(err);
    }
});
