ALTER TABLE "customers" DROP COLUMN "products_viewed";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "actions_log";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "storefront_events" DROP COLUMN "referrer";--> statement-breakpoint
ALTER TABLE "storefront_events" DROP COLUMN "utm_source";--> statement-breakpoint
ALTER TABLE "storefront_events" DROP COLUMN "utm_medium";--> statement-breakpoint
ALTER TABLE "storefront_events" DROP COLUMN "utm_campaign";