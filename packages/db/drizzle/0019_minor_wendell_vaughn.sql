ALTER TABLE "customer_addresses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_analytics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_admins" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_customers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inventory_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_offers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_reviews" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "social_integrations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "customer_addresses" CASCADE;--> statement-breakpoint
DROP TABLE "customer_analytics" CASCADE;--> statement-breakpoint
DROP TABLE "platform_admins" CASCADE;--> statement-breakpoint
DROP TABLE "store_customers" CASCADE;--> statement-breakpoint
DROP TABLE "product_categories" CASCADE;--> statement-breakpoint
DROP TABLE "store_categories" CASCADE;--> statement-breakpoint
DROP TABLE "inventory_items" CASCADE;--> statement-breakpoint
DROP TABLE "product_offers" CASCADE;--> statement-breakpoint
DROP TABLE "product_reviews" CASCADE;--> statement-breakpoint
DROP TABLE "social_integrations" CASCADE;--> statement-breakpoint
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_slug_unique";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_store_slug_unique";--> statement-breakpoint
DROP INDEX "tenants_slug_idx";--> statement-breakpoint
DROP INDEX "stores_sanity_idx";--> statement-breakpoint
DROP INDEX "stores_status_idx";--> statement-breakpoint
DROP INDEX "products_status_idx";--> statement-breakpoint
DROP INDEX "products_source_idx";--> statement-breakpoint
DROP INDEX "products_source_id_idx";--> statement-breakpoint
ALTER TABLE "tenant_memberships" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "store_memberships" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "status" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "status" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "owner_name";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "owner_phone";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "business_type";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "categories";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "sanity_store_id";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "sanity_design_system";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "logo_url";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "cover_url";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "favicon_url";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "meta_title";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "meta_description";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "facebook_url";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "instagram_url";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "twitter_url";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "whatsapp_number";--> statement-breakpoint
ALTER TABLE "media_objects" DROP COLUMN "size_bytes";--> statement-breakpoint
ALTER TABLE "media_objects" DROP COLUMN "width";--> statement-breakpoint
ALTER TABLE "media_objects" DROP COLUMN "height";--> statement-breakpoint
ALTER TABLE "media_objects" DROP COLUMN "duration";--> statement-breakpoint
ALTER TABLE "media_objects" DROP COLUMN "alt_text";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "compare_at_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "short_description";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "compare_at_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "meta_title";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "meta_description";--> statement-breakpoint
DROP TYPE "public"."tenant_role";--> statement-breakpoint
DROP TYPE "public"."tenant_status";--> statement-breakpoint
DROP TYPE "public"."product_status";