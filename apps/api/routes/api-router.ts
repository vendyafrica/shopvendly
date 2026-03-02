import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const { storefrontOrdersRouter } = require("../features/orders/routes/storefront-orders.js") as typeof import("../features/orders/routes/storefront-orders.js");
const { tenantOrdersRouter } = require("../features/orders/routes/tenant-orders.js") as typeof import("../features/orders/routes/tenant-orders.js");
const { orderSimulationsRouter } = require("../features/orders/routes/order-simulations.js") as typeof import("../features/orders/routes/order-simulations.js");
const { paystackPaymentsRouter } = require("../features/payments/routes/paystack-payments.js") as typeof import("../features/payments/routes/paystack-payments.js");
const { storefrontPaymentsRouter } = require("../features/payments/routes/storefront-payments.js") as typeof import("../features/payments/routes/storefront-payments.js");
const { paystackWebhookRouter } = require("../features/payments/routes/paystack-webhook.js") as typeof import("../features/payments/routes/paystack-webhook.js");
const { whatsappRouter } = require("../features/messaging/routes/whatsapp.js") as typeof import("../features/messaging/routes/whatsapp.js");
const { whatsappDeliveryRouter } = require("../features/messaging/routes/whatsapp-delivery.js") as typeof import("../features/messaging/routes/whatsapp-delivery.js");
const { whatsappTemplatesRouter } = require("../features/messaging/routes/whatsapp-templates.js") as typeof import("../features/messaging/routes/whatsapp-templates.js");
const { instagramWebhookRouter } = require("../features/social/routes/instagram-webhooks.js") as typeof import("../features/social/routes/instagram-webhooks.js");

export const apiRouter: ExpressRouter = Router();

apiRouter.use(storefrontOrdersRouter);
apiRouter.use(storefrontPaymentsRouter);
apiRouter.use(paystackPaymentsRouter);
apiRouter.use(tenantOrdersRouter);
apiRouter.use(orderSimulationsRouter);
apiRouter.use(paystackWebhookRouter);
apiRouter.use(whatsappRouter);
apiRouter.use(whatsappDeliveryRouter);
apiRouter.use(whatsappTemplatesRouter);
apiRouter.use(instagramWebhookRouter);
