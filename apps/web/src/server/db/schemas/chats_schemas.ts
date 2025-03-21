import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).default("New Chat"),
  userId: varchar("user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  status: varchar("status", { length: 20 }).default("complete").notNull(), // 'complete' or 'streaming'
});

export const chatRelations = relations(chats, ({ many }) => ({
  messages: many(chatMessages),
}));

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, {
    fields: [chatMessages.chatId],
    references: [chats.id],
  }),
}));

// Zod schemas for validation
export const insertChatSchema = createInsertSchema(chats);
export const selectChatSchema = createSelectSchema(chats);

export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const selectChatMessageSchema = createSelectSchema(chatMessages);

export const chatWithMessagesSchema = selectChatSchema.extend({
  messages: z.array(selectChatMessageSchema),
});

export type Chat = z.infer<typeof selectChatSchema>;
export type ChatMessage = z.infer<typeof selectChatMessageSchema>;
export type ChatWithMessages = z.infer<typeof chatWithMessagesSchema>;
export type NewChat = z.infer<typeof insertChatSchema>;
export type NewChatMessage = z.infer<typeof insertChatMessageSchema>;
