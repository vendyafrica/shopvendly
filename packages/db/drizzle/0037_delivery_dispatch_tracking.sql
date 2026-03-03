ALTER TABLE "orders" ADD COLUMN "delivery_provider" text;
ALTER TABLE "orders" ADD COLUMN "delivery_provider_dispatch_id" text;
ALTER TABLE "orders" ADD COLUMN "delivery_status" text;
ALTER TABLE "orders" ADD COLUMN "delivery_assigned_at" timestamp;
ALTER TABLE "orders" ADD COLUMN "delivery_completed_at" timestamp;
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending_seller_acceptance';
CREATE INDEX "orders_delivery_status_idx" ON "orders" USING btree ("delivery_status");
