CREATE TYPE "public"."theme_preset" AS ENUM('minimal', 'bold', 'elegant', 'modern', 'vintage', 'playful');--> statement-breakpoint
CREATE TABLE "store_navigation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"items" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text,
	"editor_data" jsonb,
	"meta_title" text,
	"meta_description" text,
	"is_published" boolean DEFAULT true,
	"show_in_menu" boolean DEFAULT false,
	"menu_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_pages_store_slug_unique" UNIQUE("store_id","slug")
);
--> statement-breakpoint
CREATE TABLE "platform_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"description" text,
	"sort_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_subcategories_category_slug_unique" UNIQUE("platform_category_id","slug")
);
--> statement-breakpoint
CREATE TABLE "store_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"platform_category_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"description" text,
	"sort_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_categories_store_slug_unique" UNIQUE("store_id","slug")
);
--> statement-breakpoint
CREATE TABLE "store_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"store_category_id" uuid NOT NULL,
	"platform_subcategory_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"description" text,
	"sort_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_subcategories_category_slug_unique" UNIQUE("store_category_id","slug")
);
--> statement-breakpoint
CREATE TABLE "product_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_quantity" integer DEFAULT 1,
	"max_quantity" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"is_verified_purchase" boolean DEFAULT false,
	"is_published" boolean DEFAULT true,
	"helpful_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_subcategories" (
	"product_id" uuid NOT NULL,
	"subcategory_id" uuid NOT NULL,
	CONSTRAINT "product_subcategories_product_id_subcategory_id_pk" PRIMARY KEY("product_id","subcategory_id")
);
--> statement-breakpoint
CREATE TABLE "customer_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" text,
	"email" text,
	"phone" text,
	"name" text,
	"first_purchase_at" timestamp,
	"last_purchase_at" timestamp,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spent" numeric(10, 2) DEFAULT '0' NOT NULL,
	"average_order_value" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_customers_store_user_unique" UNIQUE("store_id","user_id"),
	CONSTRAINT "store_customers_store_email_unique" UNIQUE("store_id","email")
);
--> statement-breakpoint
CREATE TABLE "saved_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_items_user_variant_unique" UNIQUE("user_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid,
	"customer_id" uuid,
	"transaction_number" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"fee" integer DEFAULT 0,
	"net_amount" integer NOT NULL,
	"payment_method" text,
	"payment_provider" text,
	"external_id" text,
	"external_status" text,
	"metadata" jsonb,
	"error_message" text,
	"processed_at" timestamp,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_tenant_transaction_number_unique" UNIQUE("tenant_id","transaction_number")
);
--> statement-breakpoint
CREATE TABLE "shipping_zone_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"shipping_zone_id" uuid NOT NULL,
	"shipping_method_id" uuid NOT NULL,
	"rate_type" text NOT NULL,
	"base_rate" integer NOT NULL,
	"per_weight_rate" integer,
	"per_item_rate" integer,
	"min_order_amount" integer,
	"max_order_amount" integer,
	"min_weight" numeric(10, 2),
	"max_weight" numeric(10, 2),
	"currency" text DEFAULT 'KES',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"countries" jsonb,
	"regions" jsonb,
	"cities" jsonb,
	"postal_codes" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_memberships" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_images" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payment_attempts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payment_intents" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payment_providers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inventory_levels" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inventory_movements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stock_locations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tenant_memberships" CASCADE;--> statement-breakpoint
DROP TABLE "tenants" CASCADE;--> statement-breakpoint
DROP TABLE "categories" CASCADE;--> statement-breakpoint
DROP TABLE "product_images" CASCADE;--> statement-breakpoint
DROP TABLE "customers" CASCADE;--> statement-breakpoint
DROP TABLE "payment_attempts" CASCADE;--> statement-breakpoint
DROP TABLE "payment_intents" CASCADE;--> statement-breakpoint
DROP TABLE "payment_providers" CASCADE;--> statement-breakpoint
DROP TABLE "inventory_levels" CASCADE;--> statement-breakpoint
DROP TABLE "inventory_movements" CASCADE;--> statement-breakpoint
DROP TABLE "stock_locations" CASCADE;--> statement-breakpoint
DROP TABLE "reviews" CASCADE;--> statement-breakpoint
ALTER TABLE "instagram_media" DROP CONSTRAINT "instagram_media_instagram_id_unique";--> statement-breakpoint
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "customer_addresses" DROP CONSTRAINT "customer_addresses_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "carts" DROP CONSTRAINT "carts_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "carts" DROP CONSTRAINT "carts_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_payment_intent_id_payment_intents_id_fk";
--> statement-breakpoint
DROP INDEX "cart_items_tenant_idx";--> statement-breakpoint
DROP INDEX "carts_tenant_idx";--> statement-breakpoint
DROP INDEX "carts_customer_idx";--> statement-breakpoint
ALTER TABLE "shipment_items" DROP CONSTRAINT "shipment_items_shipment_id_order_item_id_pk";--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media_objects" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ALTER COLUMN "variant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shipment_events" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "platform_categories" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "store_content" ADD COLUMN "editor_data" jsonb;--> statement-breakpoint
ALTER TABLE "store_content" ADD COLUMN "hero" jsonb;--> statement-breakpoint
ALTER TABLE "store_content" ADD COLUMN "sections" jsonb;--> statement-breakpoint
ALTER TABLE "store_content" ADD COLUMN "footer" jsonb;--> statement-breakpoint
ALTER TABLE "store_content" ADD COLUMN "announcement" jsonb;--> statement-breakpoint
ALTER TABLE "store_memberships" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "preset" "theme_preset" DEFAULT 'minimal' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "colors" jsonb;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "typography" jsonb;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "layout" jsonb;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "components" jsonb;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "custom_css" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "favicon_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "facebook_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "whatsapp_number" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "instagram_media" ADD COLUMN "media_object_id" uuid;--> statement-breakpoint
ALTER TABLE "instagram_media" ADD COLUMN "thumbnail_media_object_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "quantity_available" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "allow_backorder" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "product_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "price_at_add" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "currency" text DEFAULT 'KES' NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "session_id" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "guest_email" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "converted_to_order_at" timestamp;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "order_addresses" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "order_addresses" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_title" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "total_price_amount" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD COLUMN "from_value" text;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD COLUMN "to_value" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "internal_note" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "refund_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "processed_by" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "processed_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD COLUMN "event_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD COLUMN "location_details" jsonb;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD COLUMN "is_public" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD COLUMN "source" text DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "shipment_events" ADD COLUMN "carrier_event_data" jsonb;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "shipment_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "carrier" text;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "weight" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "dimensions" jsonb;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "shipping_cost" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "insurance_cost" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "currency" text DEFAULT 'KES';--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "from_address" jsonb;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "to_address" jsonb;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "label_created_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "picked_up_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "in_transit_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "out_for_delivery_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "delivered_to_name" text;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "delivery_signature" text;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "delivery_notes" text;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "carrier_shipment_id" text;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "carrier_label_url" text;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "carrier_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "store_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "carrier_code" text;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "free_shipping_threshold" integer;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "min_delivery_days" integer;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "max_delivery_days" integer;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "available_regions" jsonb;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "store_navigation" ADD CONSTRAINT "store_navigation_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_navigation" ADD CONSTRAINT "store_navigation_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_pages" ADD CONSTRAINT "store_pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_pages" ADD CONSTRAINT "store_pages_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_subcategories" ADD CONSTRAINT "platform_subcategories_platform_category_id_platform_categories_id_fk" FOREIGN KEY ("platform_category_id") REFERENCES "public"."platform_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_platform_category_id_platform_categories_id_fk" FOREIGN KEY ("platform_category_id") REFERENCES "public"."platform_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_subcategories" ADD CONSTRAINT "store_subcategories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_subcategories" ADD CONSTRAINT "store_subcategories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_subcategories" ADD CONSTRAINT "store_subcategories_store_category_id_store_categories_id_fk" FOREIGN KEY ("store_category_id") REFERENCES "public"."store_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_subcategories" ADD CONSTRAINT "store_subcategories_platform_subcategory_id_platform_subcategories_id_fk" FOREIGN KEY ("platform_subcategory_id") REFERENCES "public"."platform_subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_offers" ADD CONSTRAINT "product_offers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_offers" ADD CONSTRAINT "product_offers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_offers" ADD CONSTRAINT "product_offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_store_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."store_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_subcategories" ADD CONSTRAINT "product_subcategories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_subcategories" ADD CONSTRAINT "product_subcategories_subcategory_id_store_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."store_subcategories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_analytics" ADD CONSTRAINT "customer_analytics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_analytics" ADD CONSTRAINT "customer_analytics_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_analytics" ADD CONSTRAINT "customer_analytics_customer_id_store_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."store_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_customers" ADD CONSTRAINT "store_customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_customers" ADD CONSTRAINT "store_customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_customers" ADD CONSTRAINT "store_customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_store_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."store_customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zone_rates" ADD CONSTRAINT "shipping_zone_rates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zone_rates" ADD CONSTRAINT "shipping_zone_rates_shipping_zone_id_shipping_zones_id_fk" FOREIGN KEY ("shipping_zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zone_rates" ADD CONSTRAINT "shipping_zone_rates_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_navigation_tenant_idx" ON "store_navigation" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "store_navigation_store_idx" ON "store_navigation" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_navigation_position_idx" ON "store_navigation" USING btree ("position");--> statement-breakpoint
CREATE INDEX "store_pages_tenant_idx" ON "store_pages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "store_pages_store_idx" ON "store_pages" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_pages_published_idx" ON "store_pages" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "store_pages_menu_order_idx" ON "store_pages" USING btree ("menu_order");--> statement-breakpoint
CREATE INDEX "platform_subcategories_category_idx" ON "platform_subcategories" USING btree ("platform_category_id");--> statement-breakpoint
CREATE INDEX "store_categories_tenant_idx" ON "store_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "store_categories_store_idx" ON "store_categories" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_categories_platform_category_idx" ON "store_categories" USING btree ("platform_category_id");--> statement-breakpoint
CREATE INDEX "store_subcategories_tenant_idx" ON "store_subcategories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "store_subcategories_store_idx" ON "store_subcategories" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_subcategories_category_idx" ON "store_subcategories" USING btree ("store_category_id");--> statement-breakpoint
CREATE INDEX "store_subcategories_platform_subcategory_idx" ON "store_subcategories" USING btree ("platform_subcategory_id");--> statement-breakpoint
CREATE INDEX "product_offers_product_idx" ON "product_offers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_offers_store_idx" ON "product_offers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "product_offers_dates_idx" ON "product_offers" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "product_offers_active_idx" ON "product_offers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "product_reviews_product_idx" ON "product_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_reviews_customer_idx" ON "product_reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "product_reviews_store_idx" ON "product_reviews" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "product_reviews_rating_idx" ON "product_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "product_subcategories_product_idx" ON "product_subcategories" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_subcategories_subcategory_idx" ON "product_subcategories" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "customer_analytics_customer_idx" ON "customer_analytics" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_analytics_store_idx" ON "customer_analytics" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "customer_analytics_event_type_idx" ON "customer_analytics" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "customer_analytics_created_at_idx" ON "customer_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "store_customers_tenant_idx" ON "store_customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "store_customers_store_idx" ON "store_customers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_customers_user_idx" ON "store_customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_customers_email_idx" ON "store_customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "store_customers_phone_idx" ON "store_customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "saved_items_user_idx" ON "saved_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_items_store_idx" ON "saved_items" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "saved_items_product_idx" ON "saved_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "transactions_tenant_idx" ON "transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "transactions_store_idx" ON "transactions" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "transactions_order_idx" ON "transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "transactions_customer_idx" ON "transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_payment_method_idx" ON "transactions" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "transactions_external_id_idx" ON "transactions" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transactions_processed_at_idx" ON "transactions" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "shipping_zone_rates_zone_idx" ON "shipping_zone_rates" USING btree ("shipping_zone_id");--> statement-breakpoint
CREATE INDEX "shipping_zone_rates_method_idx" ON "shipping_zone_rates" USING btree ("shipping_method_id");--> statement-breakpoint
CREATE INDEX "shipping_zone_rates_tenant_idx" ON "shipping_zone_rates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "shipping_zones_tenant_idx" ON "shipping_zones" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "shipping_zones_store_idx" ON "shipping_zones" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "shipping_zones_active_idx" ON "shipping_zones" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "store_memberships" ADD CONSTRAINT "store_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media" ADD CONSTRAINT "instagram_media_media_object_id_media_objects_id_fk" FOREIGN KEY ("media_object_id") REFERENCES "public"."media_objects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media" ADD CONSTRAINT "instagram_media_thumbnail_media_object_id_media_objects_id_fk" FOREIGN KEY ("thumbnail_media_object_id") REFERENCES "public"."media_objects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_store_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."store_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_store_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."store_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_store_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."store_customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_categories_slug_idx" ON "platform_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "store_memberships_tenant_idx" ON "store_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "store_themes_preset_idx" ON "store_themes" USING btree ("preset");--> statement-breakpoint
CREATE INDEX "product_media_variant_idx" ON "product_media" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "product_variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "products_store_slug_idx" ON "products" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "customer_addresses_store_idx" ON "customer_addresses" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "cart_items_store_idx" ON "cart_items" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_store_idx" ON "cart_items" USING btree ("cart_id","store_id");--> statement-breakpoint
CREATE INDEX "carts_user_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "carts_session_idx" ON "carts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "carts_expires_at_idx" ON "carts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "order_addresses_store_idx" ON "order_addresses" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_items_store_idx" ON "order_items" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "order_status_events_store_idx" ON "order_status_events" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "orders_store_idx" ON "orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_placed_at_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
CREATE INDEX "refunds_store_idx" ON "refunds" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "refunds_transaction_idx" ON "refunds" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "refunds_created_at_idx" ON "refunds" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "shipment_events_store_idx" ON "shipment_events" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "shipment_events_status_idx" ON "shipment_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shipment_items_tenant_idx" ON "shipment_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "shipments_store_idx" ON "shipments" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "shipments_tracking_number_idx" ON "shipments" USING btree ("tracking_number");--> statement-breakpoint
CREATE INDEX "shipments_created_at_idx" ON "shipments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "shipping_methods_store_idx" ON "shipping_methods" USING btree ("store_id");--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "data";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "preset_name";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "custom_css_vars";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "theme_config";--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "carts" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "carts" DROP COLUMN "customer_id";--> statement-breakpoint
ALTER TABLE "refunds" DROP COLUMN "payment_intent_id";--> statement-breakpoint
ALTER TABLE "refunds" DROP COLUMN "provider_reference";--> statement-breakpoint
ALTER TABLE "refunds" DROP COLUMN "raw";--> statement-breakpoint
ALTER TABLE "instagram_media" ADD CONSTRAINT "instagram_media_tenant_instagram_id_unique" UNIQUE("tenant_id","instagram_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_slug_unique" UNIQUE("store_id","slug");--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_variant_unique" UNIQUE("cart_id","variant_id");--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_tenant_refund_number_unique" UNIQUE("tenant_id","refund_number");