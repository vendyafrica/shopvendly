import { Router } from "express";

import { storefrontOrdersRouter } from "../features/orders/routes/storefront-orders";
import { tenantOrdersRouter } from "../features/orders/routes/tenant-orders";
import { orderSimulationsRouter } from "../features/orders/routes/order-simulations";
import { paystackPaymentsRouter } from "../features/payments/routes/paystack-payments";
import { storefrontPaymentsRouter } from "../features/payments/routes/storefront-payments";
import { paystackWebhookRouter } from "../features/payments/routes/paystack-webhook";
import { whatsappRouter } from "../features/messaging/routes/whatsapp";
import { whatsappDeliveryRouter } from "../features/messaging/routes/whatsapp-delivery";
import { whatsappTemplatesRouter } from "../features/messaging/routes/whatsapp-templates";
import { instagramWebhookRouter } from "../features/social/routes/instagram-webhooks";

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
