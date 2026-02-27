CREATE TYPE "public"."payment_method" AS ENUM('mpesa', 'credit_card', 'debit_card', 'cash', 'bank_transfer');--> statement-breakpoint
ALTER TYPE "public"."payment_status" ADD VALUE 'pending' BEFORE 'authorized';--> statement-breakpoint
ALTER TYPE "public"."payment_status" ADD VALUE 'partially_paid' BEFORE 'partially_refunded';--> statement-breakpoint
CREATE TABLE "tenant_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "tenant_role" DEFAULT 'owner' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_memberships_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone_number" text,
	"slug" text NOT NULL,
	"status" "tenant_status" DEFAULT 'onboarding' NOT NULL,
	"plan" text DEFAULT 'free',
	"billing_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"config" jsonb,
	"preview_colors" jsonb,
	"theme_config" jsonb,
	"content_config" jsonb,
	"navigation_config" jsonb,
	"pages_config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "store_themes" ALTER COLUMN "preset" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_memberships_tenant_idx" ON "tenant_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_user_idx" ON "tenant_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "templates_slug_idx" ON "templates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "templates_active_idx" ON "templates" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "store_themes" ADD CONSTRAINT "store_themes_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public"."platform_admins" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."platform_admin_role";--> statement-breakpoint
CREATE TYPE "public"."platform_admin_role" AS ENUM('platform_super_admin', 'platform_admin', 'platform_support');--> statement-breakpoint
ALTER TABLE "public"."platform_admins" ALTER COLUMN "role" SET DATA TYPE "public"."platform_admin_role" USING "role"::"public"."platform_admin_role";--> statement-breakpoint
ALTER TABLE "public"."tenant_memberships" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tenant_role";--> statement-breakpoint
CREATE TYPE "public"."tenant_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
ALTER TABLE "public"."tenant_memberships" ALTER COLUMN "role" SET DATA TYPE "public"."tenant_role" USING "role"::"public"."tenant_role";--> statement-breakpoint
ALTER TABLE "public"."tenants" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tenant_status";--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('onboarding', 'active', 'suspended', 'cancelled');--> statement-breakpoint
ALTER TABLE "public"."tenants" ALTER COLUMN "status" SET DATA TYPE "public"."tenant_status" USING "status"::"public"."tenant_status";--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "fulfillment_status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."fulfillment_status";--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned', 'cancelled');--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "fulfillment_status" SET DATA TYPE "public"."fulfillment_status" USING "fulfillment_status"::"public"."fulfillment_status";--> statement-breakpoint
ALTER TABLE "public"."order_addresses" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_address_type";--> statement-breakpoint
CREATE TYPE "public"."order_address_type" AS ENUM('shipping', 'billing');--> statement-breakpoint
ALTER TABLE "public"."order_addresses" ALTER COLUMN "type" SET DATA TYPE "public"."order_address_type" USING "type"::"public"."order_address_type";--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'pending', 'processing', 'confirmed', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
DROP TYPE "public"."payment_provider";--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('mpesa_express', 'stripe', 'paypal', 'offline');--> statement-breakpoint
ALTER TABLE "public"."shipment_events" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."shipments" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."shipment_status";--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'cancelled');--> statement-breakpoint
ALTER TABLE "public"."shipment_events" ALTER COLUMN "status" SET DATA TYPE "public"."shipment_status" USING "status"::"public"."shipment_status";--> statement-breakpoint
ALTER TABLE "public"."shipments" ALTER COLUMN "status" SET DATA TYPE "public"."shipment_status" USING "status"::"public"."shipment_status";--> statement-breakpoint
DROP TYPE "public"."inventory_movement_type";--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('purchase', 'sale', 'return', 'adjustment', 'damage', 'loss', 'transfer', 'reserved', 'unreserved');--> statement-breakpoint
ALTER TABLE "public"."carts" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."cart_status";--> statement-breakpoint
CREATE TYPE "public"."cart_status" AS ENUM('active', 'abandoned', 'converted', 'expired');--> statement-breakpoint
ALTER TABLE "public"."carts" ALTER COLUMN "status" SET DATA TYPE "public"."cart_status" USING "status"::"public"."cart_status";--> statement-breakpoint
DROP TYPE "public"."payment_attempt_status";--> statement-breakpoint
DROP TYPE "public"."payment_intent_status";--> statement-breakpoint
DROP TYPE "public"."refund_status";