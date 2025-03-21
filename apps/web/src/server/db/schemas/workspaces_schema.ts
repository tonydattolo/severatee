import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  unique,
  pgEnum,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { profiles } from "./profiles_schema";

// Workspace roles enum (similar to app_role in the Supabase example)
export const WorkspaceRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

// Invitation status enum
export const InvitationStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  EXPIRED: "expired",
} as const;

// Workspace roles enum
export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
] as const);

// Invitation status enum
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
] as const);

// Workspaces table
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: text("slug"),
    description: text("description"),
    createdBy: uuid("created_by")
      .references(() => profiles.id, { onDelete: "restrict" })
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp("deleted_at"),
    role: workspaceRoleEnum("role").notNull().default("member"),
  },
  (table) => [
    // Unique constraint for slug
    unique("unique_workspace_slug").on(table.slug),

    // Policy: Authenticated users can view workspaces they're members of
    pgPolicy("view_workspace", {
      for: "select",
      to: authenticatedRole,
      using: sql`
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = ${table.id}
          AND workspace_members.user_id = auth.uid()
          AND workspace_members.deleted_at IS NULL
        )
      `,
    }),

    // Policy: Only workspace owners can update workspace details
    pgPolicy("update_workspace", {
      for: "update",
      to: authenticatedRole,
      using: sql`
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = ${table.id}
          AND workspace_members.user_id = auth.uid()
          AND workspace_members.role = 'owner'
          AND workspace_members.deleted_at IS NULL
        )
      `,
    }),

    // Policy: Authenticated users can create workspaces
    pgPolicy("create_workspace", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() = created_by`,
    }),
  ],
);

// Workspace members table
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    role: workspaceRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // Unique constraint for workspace-user combination
    unique("unique_workspace_member").on(table.workspaceId, table.userId),

    // Policy: Members can view other members in their workspaces
    pgPolicy("view_workspace_members", {
      for: "select",
      to: authenticatedRole,
      using: sql`
        EXISTS (
          SELECT 1 FROM workspace_members self
          WHERE self.workspace_id = ${table.workspaceId}
          AND self.user_id = auth.uid()
          AND self.deleted_at IS NULL
        )
      `,
    }),

    // Policy: Only admins and owners can manage members
    pgPolicy("manage_workspace_members", {
      for: "all",
      to: authenticatedRole,
      using: sql`
        EXISTS (
          SELECT 1 FROM workspace_members self
          WHERE self.workspace_id = ${table.workspaceId}
          AND self.user_id = auth.uid()
          AND self.role IN ('admin', 'owner')
          AND self.deleted_at IS NULL
        )
      `,
    }),
  ],
);

// Workspace invitations table
export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    role: workspaceRoleEnum("role").notNull().default("member"),
    status: invitationStatusEnum("status").notNull().default("pending"),
    invitedBy: uuid("invited_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    // Unique constraint for workspace-email combination
    unique("unique_workspace_invitation").on(table.workspaceId, table.email),

    // Policy: Members can view invitations for their workspace
    pgPolicy("view_workspace_invitations", {
      for: "select",
      to: authenticatedRole,
      using: sql`
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = ${table.workspaceId}
          AND workspace_members.user_id = auth.uid()
          AND workspace_members.deleted_at IS NULL
        )
      `,
    }),

    // Policy: Only admins and owners can create invitations
    pgPolicy("manage_workspace_invitations", {
      for: "all",
      to: authenticatedRole,
      using: sql`
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = ${table.workspaceId}
          AND workspace_members.user_id = auth.uid()
          AND workspace_members.role IN ('admin', 'owner')
          AND workspace_members.deleted_at IS NULL
        )
      `,
    }),
  ],
);

// Export types and schemas
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export const workspacesSelectSchema = createSelectSchema(workspaces);
export const workspacesInsertSchema = createInsertSchema(workspaces);

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
export const workspaceMembersSelectSchema =
  createSelectSchema(workspaceMembers);
export const workspaceMembersInsertSchema =
  createInsertSchema(workspaceMembers);

export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;
export type NewWorkspaceInvitation = typeof workspaceInvitations.$inferInsert;
export const workspaceInvitationsSelectSchema =
  createSelectSchema(workspaceInvitations);
export const workspaceInvitationsInsertSchema =
  createInsertSchema(workspaceInvitations);

export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
