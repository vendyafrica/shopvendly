ALTER TABLE "tenants" ADD COLUMN "generated_files" jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "vercel_deployment_url" text;