ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending_seller_acceptance';--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "delivery_provider_phone" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_provider" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_provider_dispatch_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_status" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_assigned_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_completed_at" timestamp;--> statement-breakpoint
CREATE INDEX "orders_delivery_status_idx" ON "orders" USING btree ("delivery_status");