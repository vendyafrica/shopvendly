ALTER TABLE "tiktok_accounts" ADD COLUMN IF NOT EXISTS "profile_url" text;
ALTER TABLE "tiktok_accounts" ADD COLUMN IF NOT EXISTS "last_imported_at" timestamp;

CREATE TABLE IF NOT EXISTS "tiktok_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "source_post_id" text NOT NULL,
  "title" text,
  "video_description" text,
  "duration" integer,
  "cover_image_url" text,
  "embed_link" text,
  "share_url" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at_source" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "tiktok_posts"
    ADD CONSTRAINT "tiktok_posts_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tiktok_posts"
    ADD CONSTRAINT "tiktok_posts_store_id_stores_id_fk"
    FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "tiktok_posts"
    ADD CONSTRAINT "tiktok_posts_account_id_tiktok_accounts_id_fk"
    FOREIGN KEY ("account_id") REFERENCES "public"."tiktok_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "tiktok_posts_store_source_unique" ON "tiktok_posts" USING btree ("store_id", "source_post_id");
CREATE INDEX IF NOT EXISTS "tiktok_posts_tenant_idx" ON "tiktok_posts" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "tiktok_posts_store_idx" ON "tiktok_posts" USING btree ("store_id");
CREATE INDEX IF NOT EXISTS "tiktok_posts_account_idx" ON "tiktok_posts" USING btree ("account_id");
