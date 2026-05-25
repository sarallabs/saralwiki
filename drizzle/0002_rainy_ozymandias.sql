CREATE TYPE "public"."page_access" AS ENUM('workspace', 'space', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."page_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."space_role" AS ENUM('admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "page_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"author_id" uuid,
	"content" text NOT NULL,
	"parent_id" uuid,
	"anchor_text" text,
	"anchor_id" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "space_role" DEFAULT 'viewer' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text DEFAULT '📁',
	"color" text DEFAULT '#6366f1',
	"is_private" boolean DEFAULT false NOT NULL,
	"categories" text DEFAULT '[]',
	"tags" text DEFAULT '[]',
	"homepage_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "allowed_roles" text;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "allowed_user_ids" text;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "allowed_roles" text;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "allowed_user_ids" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "space_id" uuid;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "draft_content" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "status" "page_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "access_level" "page_access" DEFAULT 'workspace' NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "depth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "is_blog_post" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "cover_image" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "allowed_roles" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "allowed_user_ids" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "allowed_roles" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "allowed_user_ids" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "app_role" text DEFAULT 'intern' NOT NULL;--> statement-breakpoint
ALTER TABLE "page_access_grants" ADD CONSTRAINT "page_access_grants_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_access_grants" ADD CONSTRAINT "page_access_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_comments" ADD CONSTRAINT "page_comments_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_comments" ADD CONSTRAINT "page_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_grant_idx" ON "page_access_grants" USING btree ("page_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "page_grant_unique" ON "page_access_grants" USING btree ("page_id","user_id");--> statement-breakpoint
CREATE INDEX "page_comment_page_idx" ON "page_comments" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "space_member_idx" ON "space_members" USING btree ("space_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "space_member_unique" ON "space_members" USING btree ("space_id","user_id");--> statement-breakpoint
CREATE INDEX "space_workspace_idx" ON "spaces" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_space_idx" ON "pages" USING btree ("space_id");