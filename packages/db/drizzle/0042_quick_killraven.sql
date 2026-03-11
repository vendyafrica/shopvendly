ALTER TABLE "tiktok_posts" ALTER COLUMN "account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tiktok_posts" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_reference" text;