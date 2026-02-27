CREATE TYPE "public"."onboarding_step" AS ENUM('signup', 'personal', 'store', 'business', 'complete');--> statement-breakpoint
CREATE TABLE "content_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"media_id" uuid,
	"caption" text,
	"tone" text NOT NULL,
	"style_prompt" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instagram_connections" RENAME TO "instagram_accounts";--> statement-breakpoint
ALTER TABLE "instagram_sync_jobs" RENAME TO "instagram_media_jobs";--> statement-breakpoint
ALTER TABLE "stores" RENAME COLUMN "phone" TO "store_contact_phone";--> statement-breakpoint
ALTER TABLE "stores" RENAME COLUMN "email" TO "store_contact_email";--> statement-breakpoint
ALTER TABLE "stores" RENAME COLUMN "address" TO "store_address";--> statement-breakpoint
ALTER TABLE "products" RENAME COLUMN "title" TO "product_name";--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_tenant_sku_unique";--> statement-breakpoint
ALTER TABLE "instagram_accounts" DROP CONSTRAINT "instagram_connections_tenant_account_unique";--> statement-breakpoint
ALTER TABLE "instagram_accounts" DROP CONSTRAINT "instagram_connections_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "instagram_accounts" DROP CONSTRAINT "instagram_connections_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "instagram_media_jobs" DROP CONSTRAINT "instagram_sync_jobs_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "instagram_media_jobs" DROP CONSTRAINT "instagram_sync_jobs_connection_id_instagram_connections_id_fk";
--> statement-breakpoint
DROP INDEX "product_variants_sku_idx";--> statement-breakpoint
DROP INDEX "instagram_connections_tenant_idx";--> statement-breakpoint
DROP INDEX "instagram_connections_user_idx";--> statement-breakpoint
DROP INDEX "instagram_sync_jobs_tenant_idx";--> statement-breakpoint
DROP INDEX "instagram_sync_jobs_connection_idx";--> statement-breakpoint
DROP INDEX "instagram_sync_jobs_status_idx";--> statement-breakpoint
DROP INDEX "instagram_sync_jobs_created_idx";--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "onboarding_step" "onboarding_step" DEFAULT 'signup' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "onboarding_data" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "categories" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "variant_name" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "has_content_variants" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "instagram_media_jobs" ADD COLUMN "account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_media_id_media_objects_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_objects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_variants_tenant_idx" ON "content_variants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "content_variants_product_idx" ON "content_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "content_variants_tone_idx" ON "content_variants" USING btree ("tone");--> statement-breakpoint
ALTER TABLE "instagram_accounts" ADD CONSTRAINT "instagram_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_accounts" ADD CONSTRAINT "instagram_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media_jobs" ADD CONSTRAINT "instagram_media_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media_jobs" ADD CONSTRAINT "instagram_media_jobs_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "instagram_accounts_tenant_idx" ON "instagram_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "instagram_accounts_user_idx" ON "instagram_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "instagram_media_jobs_tenant_idx" ON "instagram_media_jobs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "instagram_media_jobs_account_idx" ON "instagram_media_jobs" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "instagram_media_jobs_status_idx" ON "instagram_media_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "instagram_media_jobs_created_idx" ON "instagram_media_jobs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "theme";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "sku";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "has_variants";--> statement-breakpoint
ALTER TABLE "instagram_media_jobs" DROP COLUMN "connection_id";--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "instagram_accounts" ADD CONSTRAINT "instagram_accounts_tenant_account_unique" UNIQUE("tenant_id","account_id");