CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" text,
	"name" text,
	"email" text NOT NULL,
	"phone" text,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spend" numeric(12, 2) DEFAULT '0' NOT NULL,
	"last_order_at" timestamp,
	"products_viewed" jsonb DEFAULT '[]'::jsonb,
	"actions_log" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "super_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'super_admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "content_variants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_customers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_customers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_assets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_variants" CASCADE;--> statement-breakpoint
DROP TABLE "content_variants" CASCADE;--> statement-breakpoint
DROP TABLE "platform_customers" CASCADE;--> statement-breakpoint
DROP TABLE "store_customers" CASCADE;--> statement-breakpoint
DROP TABLE "platform_roles" CASCADE;--> statement-breakpoint
DROP TABLE "store_categories" CASCADE;--> statement-breakpoint
DROP TABLE "admin_assets" CASCADE;--> statement-breakpoint
DROP TABLE "payments" CASCADE;--> statement-breakpoint
ALTER TABLE "stores" DROP CONSTRAINT "stores_custom_domain_unique";--> statement-breakpoint
ALTER TABLE "product_media" DROP CONSTRAINT "product_media_variant_id_product_variants_id_fk";
--> statement-breakpoint
DROP INDEX "products_store_featured_idx";--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "hero_media" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "hero_media" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "currency" SET DEFAULT 'UGX';--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "currency" SET DEFAULT 'UGX';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'UGX';--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variants" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "super_admins" ADD CONSTRAINT "super_admins_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_tenant_idx" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "customers_store_idx" ON "customers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "customers_user_idx" ON "customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "super_admins_user_idx" ON "super_admins" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "store_rating";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "store_rating_count";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "custom_domain";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "domain_verified";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "domain_verified_at";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "hero_media_type";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "hero_media_items";--> statement-breakpoint
ALTER TABLE "product_media" DROP COLUMN "variant_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "has_content_variants";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "style_guide_enabled";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "style_guide_type";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_cost";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_address";