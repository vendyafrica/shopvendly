ALTER TABLE "stores" ALTER COLUMN "default_currency" SET DEFAULT 'UGX';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_address" text;