ALTER TABLE "products" ADD COLUMN "style_guide_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "style_guide_type" text;
