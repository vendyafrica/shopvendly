CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" text,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anonymous_chat_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_ownerships" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "anonymous_chat_logs" CASCADE;--> statement-breakpoint
DROP TABLE "chat_ownerships" CASCADE;--> statement-breakpoint
ALTER TABLE "store_memberships" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "store_content" ADD COLUMN "data" jsonb;--> statement-breakpoint
ALTER TABLE "store_themes" ADD COLUMN "theme_config" jsonb;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_tenant_idx" ON "reviews" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "reviews_store_idx" ON "reviews" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "page_data";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "hero_config";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "footer_config";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "hero_label";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "hero_title";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "hero_subtitle";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "hero_cta";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "hero_image_url";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "featured_sections";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "footer_description";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "newsletter_title";--> statement-breakpoint
ALTER TABLE "store_content" DROP COLUMN "newsletter_subtitle";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "primary_color";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "secondary_color";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "accent_color";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "background_color";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "text_color";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "heading_font";--> statement-breakpoint
ALTER TABLE "store_themes" DROP COLUMN "body_font";