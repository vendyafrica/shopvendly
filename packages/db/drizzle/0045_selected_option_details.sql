ALTER TABLE "cart_items" ADD COLUMN "selected_options" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "selected_options" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_item_unique";--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_item_unique" UNIQUE("cart_id","product_id","selected_options");
