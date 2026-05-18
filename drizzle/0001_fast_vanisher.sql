ALTER TABLE "users" ADD COLUMN "clerk_user_id" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_idx" ON "users" USING btree ("clerk_user_id");