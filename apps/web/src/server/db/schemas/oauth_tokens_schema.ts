import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  index,
  unique,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersInAuth } from "migrations/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const oauthTokens = pgTable(
  "oauth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersInAuth.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(), // 'google', 'microsoft', etc.
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    scopes: text("scopes"), // Store granted scopes
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    // Unique constraint to ensure one token set per user per provider
    unique("unique_user_provider").on(table.userId, table.provider),

    // Index for faster lookups
    index("idx_oauth_tokens_user_provider").on(table.userId, table.provider),
  ],
);

export type OAuthToken = typeof oauthTokens.$inferSelect;
export type NewOAuthToken = typeof oauthTokens.$inferInsert;
export const oauthTokensSelectSchema = createSelectSchema(oauthTokens);
export const oauthTokensInsertSchema = createInsertSchema(oauthTokens);
