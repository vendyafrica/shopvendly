CREATE TABLE "social_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"platform_user_id" text NOT NULL,
	"platform_username" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"auto_import_enabled" boolean DEFAULT false,
	"last_imported_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_integrations_platform_user_unique" UNIQUE("platform","platform_user_id","store_id")
);
--> statement-breakpoint
ALTER TABLE "store_content" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_navigation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_pages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_themes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "templates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_subcategories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_subcategories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "instagram_media" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_subcategories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cart_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "carts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "saved_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_addresses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_status_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "refunds" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipment_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipment_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipping_methods" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipping_zone_rates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipping_zones" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "store_content" CASCADE;--> statement-breakpoint
DROP TABLE "store_navigation" CASCADE;--> statement-breakpoint
DROP TABLE "store_pages" CASCADE;--> statement-breakpoint
DROP TABLE "store_themes" CASCADE;--> statement-breakpoint
DROP TABLE "templates" CASCADE;--> statement-breakpoint
DROP TABLE "platform_categories" CASCADE;--> statement-breakpoint
DROP TABLE "platform_subcategories" CASCADE;--> statement-breakpoint
DROP TABLE "store_subcategories" CASCADE;--> statement-breakpoint
DROP TABLE "instagram_media" CASCADE;--> statement-breakpoint
DROP TABLE "product_subcategories" CASCADE;--> statement-breakpoint
DROP TABLE "cart_items" CASCADE;--> statement-breakpoint
DROP TABLE "carts" CASCADE;--> statement-breakpoint
DROP TABLE "saved_items" CASCADE;--> statement-breakpoint
DROP TABLE "order_addresses" CASCADE;--> statement-breakpoint
DROP TABLE "order_items" CASCADE;--> statement-breakpoint
DROP TABLE "order_status_events" CASCADE;--> statement-breakpoint
DROP TABLE "orders" CASCADE;--> statement-breakpoint
DROP TABLE "refunds" CASCADE;--> statement-breakpoint
DROP TABLE "transactions" CASCADE;--> statement-breakpoint
DROP TABLE "shipment_events" CASCADE;--> statement-breakpoint
DROP TABLE "shipment_items" CASCADE;--> statement-breakpoint
DROP TABLE "shipments" CASCADE;--> statement-breakpoint
DROP TABLE "shipping_methods" CASCADE;--> statement-breakpoint
DROP TABLE "shipping_zone_rates" CASCADE;--> statement-breakpoint
DROP TABLE "shipping_zones" CASCADE;--> statement-breakpoint
ALTER TABLE "store_categories" DROP CONSTRAINT "store_categories_platform_category_id_platform_categories_id_fk";
--> statement-breakpoint
DROP INDEX "store_categories_platform_category_idx";--> statement-breakpoint
DROP INDEX "product_media_variant_idx";--> statement-breakpoint
DROP INDEX "products_featured_idx";--> statement-breakpoint
DROP INDEX "products_store_slug_idx";--> statement-breakpoint
ALTER TABLE "store_categories" ALTER COLUMN "sort_order" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "store_categories" ALTER COLUMN "sort_order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media_objects" ALTER COLUMN "blob_pathname" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media_objects" ALTER COLUMN "content_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media_objects" ALTER COLUMN "size_bytes" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "media_objects" ALTER COLUMN "size_bytes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media_objects" ALTER COLUMN "is_public" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media_objects" ALTER COLUMN "source" SET DEFAULT 'upload';--> statement-breakpoint
ALTER TABLE "media_objects" ALTER COLUMN "source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "sort_order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "is_featured" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_name" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_phone" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "business_type" text[];--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "categories" text[];--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "sanity_store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "sanity_design_system" text DEFAULT 'design-system-modern';--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "custom_domain" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "domain_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "domain_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "store_categories" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "store_categories" ADD COLUMN "is_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "media_objects" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "media_objects" ADD COLUMN "source_media_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "currency" text DEFAULT 'KES' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "social_integrations" ADD CONSTRAINT "social_integrations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_integrations" ADD CONSTRAINT "social_integrations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_integrations_store_idx" ON "social_integrations" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "social_integrations_tenant_idx" ON "social_integrations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "stores_sanity_idx" ON "stores" USING btree ("sanity_store_id");--> statement-breakpoint
CREATE INDEX "store_categories_parent_idx" ON "store_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "media_objects_source_idx" ON "media_objects" USING btree ("source");--> statement-breakpoint
CREATE INDEX "product_media_sort_idx" ON "product_media" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "products_source_idx" ON "products" USING btree ("source");--> statement-breakpoint
CREATE INDEX "products_source_id_idx" ON "products" USING btree ("source_id");--> statement-breakpoint
ALTER TABLE "store_categories" DROP COLUMN "platform_category_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "base_price_amount";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "base_currency";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "featured";--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_custom_domain_unique" UNIQUE("custom_domain");--> statement-breakpoint
DROP TYPE "public"."platform_admin_role";--> statement-breakpoint
DROP TYPE "public"."fulfillment_status";--> statement-breakpoint
DROP TYPE "public"."order_address_type";--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
DROP TYPE "public"."payment_status";--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
DROP TYPE "public"."payment_provider";--> statement-breakpoint
DROP TYPE "public"."shipment_status";--> statement-breakpoint
DROP TYPE "public"."inventory_movement_type";--> statement-breakpoint
DROP TYPE "public"."cart_status";--> statement-breakpoint
DROP TYPE "public"."store_role";--> statement-breakpoint
DROP TYPE "public"."store_status";--> statement-breakpoint
DROP TYPE "public"."theme_preset";