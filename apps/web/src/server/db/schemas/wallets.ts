// import { sql } from "drizzle-orm";
// import { pgTable, text, timestamp, uuid, pgPolicy } from "drizzle-orm/pg-core";
// import { authenticatedRole } from "drizzle-orm/supabase";
// import { createInsertSchema, createSelectSchema } from "drizzle-zod";
// import { profiles } from "./profiles_schema";

// export const wallets = pgTable(
//   "wallets",
//   {
//     id: uuid("id").primaryKey().notNull(),
//     userId: uuid("user_id")
//       .notNull()
//       .references(() => profiles.id),
//     walletId: text("wallet_id").notNull().unique(),
//     address: text("address").notNull(),
//     networkId: text("network_id").notNull(),
//     encryptedData: text("encrypted_data").notNull(), // Stores encrypted wallet data
//     authorizationKeyId: text("authorization_key_id"),
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at")
//       .notNull()
//       .defaultNow()
//       .$onUpdateFn(() => new Date()),
//   },
//   (table) => [
//     pgPolicy("users_can_read_own_wallets", {
//       for: "select",
//       to: authenticatedRole,
//       using: sql`auth.uid() = ${table.userId}`,
//     }),
//     pgPolicy("users_can_insert_own_wallets", {
//       for: "insert",
//       to: authenticatedRole,
//       withCheck: sql`auth.uid() = ${table.userId}`,
//     }),
//     pgPolicy("users_can_update_own_wallets", {
//       for: "update",
//       to: authenticatedRole,
//       using: sql`auth.uid() = ${table.userId}`,
//     }),
//   ],
// );

// export const walletTransactions = pgTable(
//   "wallet_transactions",
//   {
//     id: uuid("id").primaryKey().notNull(),
//     walletId: uuid("wallet_id")
//       .notNull()
//       .references(() => wallets.id),
//     txHash: text("tx_hash").notNull(),
//     networkId: text("network_id").notNull(),
//     status: text("status").notNull(), // pending, confirmed, failed
//     type: text("type").notNull(), // send, receive, contract_interaction
//     data: text("data").notNull(), // JSON string with transaction details
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at")
//       .notNull()
//       .defaultNow()
//       .$onUpdateFn(() => new Date()),
//   },
//   (table) => [
//     pgPolicy("users_can_read_own_transactions", {
//       for: "select",
//       to: authenticatedRole,
//       using: sql`EXISTS (
//         SELECT 1 FROM wallets
//         WHERE wallets.id = ${table.walletId}
//         AND wallets.user_id = auth.uid()
//       )`,
//     }),
//     pgPolicy("users_can_insert_own_transactions", {
//       for: "insert",
//       to: authenticatedRole,
//       withCheck: sql`EXISTS (
//         SELECT 1 FROM wallets
//         WHERE wallets.id = ${table.walletId}
//         AND wallets.user_id = auth.uid()
//       )`,
//     }),
//   ],
// );

// export const walletTasks = pgTable(
//   "wallet_tasks",
//   {
//     id: uuid("id").primaryKey().notNull(),
//     walletId: uuid("wallet_id")
//       .notNull()
//       .references(() => wallets.id),
//     status: text("status").notNull(), // pending, in_progress, completed, failed
//     type: text("type").notNull(), // TEE_task, verification, funding
//     data: text("data").notNull(), // JSON string with task details
//     result: text("result"), // JSON string with task results
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at")
//       .notNull()
//       .defaultNow()
//       .$onUpdateFn(() => new Date()),
//   },
//   (table) => [
//     pgPolicy("users_can_read_own_tasks", {
//       for: "select",
//       to: authenticatedRole,
//       using: sql`EXISTS (
//         SELECT 1 FROM wallets
//         WHERE wallets.id = ${table.walletId}
//         AND wallets.user_id = auth.uid()
//       )`,
//     }),
//     pgPolicy("users_can_insert_own_tasks", {
//       for: "insert",
//       to: authenticatedRole,
//       withCheck: sql`EXISTS (
//         SELECT 1 FROM wallets
//         WHERE wallets.id = ${table.walletId}
//         AND wallets.user_id = auth.uid()
//       )`,
//     }),
//   ],
// );

// // Add type definitions and schemas
// export type Wallet = typeof wallets.$inferSelect;
// export type NewWallet = typeof wallets.$inferInsert;
// export const walletsSelectSchema = createSelectSchema(wallets);
// export const walletsInsertSchema = createInsertSchema(wallets);

// export type WalletTransaction = typeof walletTransactions.$inferSelect;
// export type NewWalletTransaction = typeof walletTransactions.$inferInsert;
// export const walletTransactionsSelectSchema =
//   createSelectSchema(walletTransactions);
// export const walletTransactionsInsertSchema =
//   createInsertSchema(walletTransactions);

// export type WalletTask = typeof walletTasks.$inferSelect;
// export type NewWalletTask = typeof walletTasks.$inferInsert;
// export const walletTasksSelectSchema = createSelectSchema(walletTasks);
// export const walletTasksInsertSchema = createInsertSchema(walletTasks);
