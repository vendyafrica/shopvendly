ALTER TABLE "instagram_media" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "instagram_media" ADD CONSTRAINT "instagram_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "instagram_media_product_idx" ON "instagram_media" USING btree ("product_id");