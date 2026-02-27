CREATE TABLE "store_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"hero_label" text DEFAULT 'Urban Style',
	"hero_title" text,
	"hero_subtitle" text,
	"hero_cta" text DEFAULT 'Discover Now',
	"hero_image_url" text,
	"featured_sections" jsonb,
	"footer_description" text,
	"newsletter_title" text DEFAULT 'Subscribe to our newsletter',
	"newsletter_subtitle" text DEFAULT 'Get the latest updates on new products and upcoming sales',
	"page_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_content_store_id_unique" UNIQUE("store_id")
);
--> statement-breakpoint
CREATE TABLE "store_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"primary_color" text DEFAULT '#1a1a2e',
	"secondary_color" text DEFAULT '#4a6fa5',
	"accent_color" text DEFAULT '#ffffff',
	"background_color" text DEFAULT '#ffffff',
	"text_color" text DEFAULT '#1a1a2e',
	"heading_font" text DEFAULT 'Inter',
	"body_font" text DEFAULT 'Inter',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_themes_store_id_unique" UNIQUE("store_id")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "inventory_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_content" ADD CONSTRAINT "store_content_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_themes" ADD CONSTRAINT "store_themes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_content_store_idx" ON "store_content" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_themes_store_idx" ON "store_themes" USING btree ("store_id");