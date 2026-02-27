ALTER TABLE "stores" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "hero_media_items" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "style_guide_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "style_guide_type" text;--> statement-breakpoint
ALTER TABLE "instagram_accounts" ADD COLUMN "profile_picture_url" text;--> statement-breakpoint
CREATE INDEX "products_store_status_idx" ON "products" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "products_store_featured_idx" ON "products" USING btree ("store_id","is_featured");--> statement-breakpoint
CREATE INDEX "products_store_updated_idx" ON "products" USING btree ("store_id","updated_at");--> statement-breakpoint
CREATE INDEX "orders_tenant_created_idx" ON "orders" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_tenant_status_created_idx" ON "orders" USING btree ("tenant_id","status","created_at");