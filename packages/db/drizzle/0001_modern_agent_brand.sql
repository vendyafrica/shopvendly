ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "chat_ownerships" DROP CONSTRAINT "chat_ownerships_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_ownerships" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "chat_ownerships" ADD CONSTRAINT "chat_ownerships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;