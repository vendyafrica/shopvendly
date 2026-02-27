import { Router } from "express";

import { storefrontOrdersRouter } from "../modules/storefront-orders.routes";
import { tenantOrdersRouter } from "../modules/tenant-orders.routes";
import { orderSimulationsRouter } from "../modules/order-simulations-routes";
import { paystackPaymentsRouter } from "../features/payments/routes/paystack-payments";
import { storefrontPaymentsRouter } from "../modules/storefront-payments.routes";
import { paystackWebhookRouter } from "../modules/paystack-webhook.routes";
import { whatsappRouter } from "../modules/whatsapp/whatsapp-webhook.routes";
import { whatsappDeliveryRouter } from "../modules/whatsapp/whatsapp-delivery.routes";
import { whatsappTemplatesRouter } from "../modules/whatsapp/whatsapp-templates.routes";
import { instagramWebhookRouter } from "../modules/instagram/instagram-webhook.routes";

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
