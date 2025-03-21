import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  index,
  unique,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersInAuth } from "migrations/schema";
import { authenticatedRole } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// /**
//  * We need a way to reference the 'auth' schema for the 'users' table.
//  * But we don't want to be able to access the auth schema programmatically via Drizzle ORM
//  * because it's a security risk. So we use the `pgTable` function to create a reference to the
//  * 'auth.users' table.
//  * https://github.com/supabase/supabase/issues/19883#issuecomment-2094656180
//  */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => usersInAuth.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    username: text("username"),
    email: varchar("email", { length: 255 }),
    role: varchar("role", { length: 20 }).notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // Unique constraint for email
    unique("unique_email").on(table.email),

    // Policy 1: Public profiles are viewable by everyone
    pgPolicy("public_profiles_viewable", {
      for: "select",
      to: "public",
      using: sql`true`,
    }),

    // Policy 2: Users can insert their own profile
    pgPolicy("insert_own_profile", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() = ${table.id}`,
    }),

    // Policy 3: Users can update their own profile
    pgPolicy("update_own_profile", {
      for: "update",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.id}`,
    }),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export const profilesSelectSchema = createSelectSchema(profiles);
export const profilesInsertSchema = createInsertSchema(profiles);
