ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "app_role" text NOT NULL DEFAULT 'intern';

ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "allowed_roles" text;
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "allowed_user_ids" text;

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "allowed_roles" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "allowed_user_ids" text;

ALTER TABLE "issues" ADD COLUMN IF NOT EXISTS "allowed_roles" text;
ALTER TABLE "issues" ADD COLUMN IF NOT EXISTS "allowed_user_ids" text;

ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "allowed_roles" text;
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "allowed_user_ids" text;

UPDATE "users"
SET "app_role" = CASE
  WHEN "is_global_admin" = true THEN 'admin'
  ELSE 'intern'
END
WHERE "app_role" IS NULL OR "app_role" = 'intern';
