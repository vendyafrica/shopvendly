ALTER TABLE "stores" ADD COLUMN "store_rating" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "store_rating_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rating" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rating_count" integer DEFAULT 0;