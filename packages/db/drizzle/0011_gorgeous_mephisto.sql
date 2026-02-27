CREATE TYPE "public"."store_role" AS ENUM('store_owner', 'manager', 'seller', 'viewer');--> statement-breakpoint
CREATE TABLE "store_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "store_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_memberships_unique" UNIQUE("store_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"variant_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"quantity_reserved" integer DEFAULT 0,
	"track_inventory" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"blob_url" text NOT NULL,
	"blob_pathname" text,
	"content_type" text,
	"size_bytes" bigint,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"is_public" boolean DEFAULT true,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"variant_id" uuid,
	"sort_order" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text,
	"title" text,
	"price_amount" integer NOT NULL,
	"currency" text DEFAULT 'KES',
	"compare_at_price" integer,
	"options" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_variants_tenant_sku_unique" UNIQUE("tenant_id","sku")
);
--> statement-breakpoint
ALTER TABLE "stores" DROP CONSTRAINT "stores_slug_unique";--> statement-breakpoint
DROP INDEX "products_store_idx";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "platform_category_id" uuid;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "sort_order" integer;--> statement-breakpoint
ALTER TABLE "instagram_media" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "base_price_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "base_currency" text DEFAULT 'KES' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "compare_at_price" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "has_variants" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "store_content" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "store_content" ADD COLUMN "hero_config" jsonb;--> statement-breakpoint
ALTER TABLE "store_content" ADD COLUMN "footer_config" jsonb;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "preset_name" text;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "custom_css_vars" jsonb;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "default_currency" text DEFAULT 'KES' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "store_memberships" ADD CONSTRAINT "store_memberships_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_memberships" ADD CONSTRAINT "store_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_media_id_media_objects_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_memberships_store_idx" ON "store_memberships" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_memberships_user_idx" ON "store_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "inventory_items_tenant_idx" ON "inventory_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "media_objects_tenant_idx" ON "media_objects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "media_objects_blob_pathname_idx" ON "media_objects" USING btree ("blob_pathname");--> statement-breakpoint
CREATE INDEX "product_media_product_idx" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_media_idx" ON "product_media" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_platform_category_id_platform_categories_id_fk" FOREIGN KEY ("platform_category_id") REFERENCES "public"."platform_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media" ADD CONSTRAINT "instagram_media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_content" ADD CONSTRAINT "store_content_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_themes" ADD CONSTRAINT "store_themes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_tenant_idx" ON "categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "categories_platform_category_idx" ON "categories" USING btree ("platform_category_id");--> statement-breakpoint
CREATE INDEX "products_tenant_store_idx" ON "products" USING btree ("tenant_id","store_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_content_tenant_idx" ON "store_content" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "store_themes_tenant_idx" ON "store_themes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "stores_slug_idx" ON "stores" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "stores_status_idx" ON "stores" USING btree ("status");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "price_amount";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "inventory_quantity";--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_tenant_slug_unique" UNIQUE("tenant_id","slug");