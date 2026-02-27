CREATE TABLE "instagram_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"instagram_id" text NOT NULL,
	"media_type" text NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"permalink" text,
	"caption" text,
	"timestamp" timestamp,
	"is_imported" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_media_instagram_id_unique" UNIQUE("instagram_id")
);
--> statement-breakpoint
ALTER TABLE "instagram_media" ADD CONSTRAINT "instagram_media_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "instagram_media_store_idx" ON "instagram_media" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "instagram_media_instagram_id_idx" ON "instagram_media" USING btree ("instagram_id");