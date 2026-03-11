ALTER TABLE "tiktok_accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tiktok_posts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tiktok_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "tiktok_posts" CASCADE;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "variants" SET DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "original_price_amount" integer;