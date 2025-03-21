CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "workspace_role" DEFAULT 'member' NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_workspace_invitation" UNIQUE("workspace_id","email")
);
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "workspace_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "unique_workspace_member" UNIQUE("workspace_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" text,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"role" "workspace_role" DEFAULT 'member' NOT NULL,
	CONSTRAINT "unique_workspace_slug" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE POLICY "view_workspace_invitations" ON "workspace_invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = "workspace_invitations"."workspace_id"
          AND workspace_members.user_id = auth.uid()
          AND workspace_members.deleted_at IS NULL
        )
      );--> statement-breakpoint
CREATE POLICY "manage_workspace_invitations" ON "workspace_invitations" AS PERMISSIVE FOR ALL TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = "workspace_invitations"."workspace_id"
          AND workspace_members.user_id = auth.uid()
          AND workspace_members.role IN ('admin', 'owner')
          AND workspace_members.deleted_at IS NULL
        )
      );--> statement-breakpoint
CREATE POLICY "view_workspace_members" ON "workspace_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM workspace_members self
          WHERE self.workspace_id = "workspace_members"."workspace_id"
          AND self.user_id = auth.uid()
          AND self.deleted_at IS NULL
        )
      );--> statement-breakpoint
CREATE POLICY "manage_workspace_members" ON "workspace_members" AS PERMISSIVE FOR ALL TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM workspace_members self
          WHERE self.workspace_id = "workspace_members"."workspace_id"
          AND self.user_id = auth.uid()
          AND self.role IN ('admin', 'owner')
          AND self.deleted_at IS NULL
        )
      );--> statement-breakpoint
CREATE POLICY "view_workspace" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = "workspaces"."id"
          AND workspace_members.user_id = auth.uid()
          AND workspace_members.deleted_at IS NULL
        )
      );--> statement-breakpoint
CREATE POLICY "update_workspace" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = "workspaces"."id"
          AND workspace_members.user_id = auth.uid()
          AND workspace_members.role = 'owner'
          AND workspace_members.deleted_at IS NULL
        )
      );--> statement-breakpoint
CREATE POLICY "create_workspace" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() = created_by);