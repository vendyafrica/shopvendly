import { Router } from "express";

import { storefrontOrdersRouter } from "../features/orders/routes/storefront-orders.js";
import { tenantOrdersRouter } from "../features/orders/routes/tenant-orders.js";
import { orderSimulationsRouter } from "../features/orders/routes/order-simulations.js";
import { paystackPaymentsRouter } from "../features/payments/routes/paystack-payments.js";
import { storefrontPaymentsRouter } from "../features/payments/routes/storefront-payments.js";
import { paystackWebhookRouter } from "../features/payments/routes/paystack-webhook.js";
import { whatsappRouter } from "../features/messaging/routes/whatsapp.js";
import { whatsappDeliveryRouter } from "../features/messaging/routes/whatsapp-delivery.js";
import { whatsappTemplatesRouter } from "../features/messaging/routes/whatsapp-templates.js";
import { instagramWebhookRouter } from "../features/social/routes/instagram-webhooks.js";

export const apiRouter: Router = Router();

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
