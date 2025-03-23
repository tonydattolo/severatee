import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Lumon AI agents that perform tasks
export const lumonAgents = pgTable("lumon_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 42 }).unique(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, maintenance
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  metadata: jsonb("metadata"), // Additional agent metadata like capabilities, specialties, etc.
});

// Task instances assigned to agents
export const lumonTasks = pgTable("lumon_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  instructions: text("instructions").notNull(),
  agentId: uuid("agent_id").references(() => lumonAgents.id),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("assigned")
    .$type<
      | "unassigned"
      | "assigned"
      | "in_progress"
      | "completed"
      | "rejected"
      | "failed"
    >(), // unassigned, assigned, in_progress, completed, rejected, failed
  progress: integer("progress").notNull().default(0), // 0-100
  answer: text("answer"), // Store the task answer
  signature: varchar("signature", { length: 255 }), // Store the task answer signature
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  nillionRecordId: varchar("nillion_record_id", { length: 255 }),
  metadata: jsonb("metadata"),
});

// Relations
export const lumonAgentsRelations = relations(lumonAgents, ({ many }) => ({
  tasks: many(lumonTasks),
}));

export const lumonTasksRelations = relations(lumonTasks, ({ one, many }) => ({
  agent: one(lumonAgents, {
    fields: [lumonTasks.agentId],
    references: [lumonAgents.id],
  }),
}));

// Zod schemas for validation
export const insertLumonAgentSchema = createInsertSchema(lumonAgents);
export const selectLumonAgentSchema = createSelectSchema(lumonAgents);

export const insertLumonTaskSchema = createInsertSchema(lumonTasks);
export const selectLumonTaskSchema = createSelectSchema(lumonTasks);

export type LumonAgent = z.infer<typeof selectLumonAgentSchema>;
export type LumonTask = z.infer<typeof selectLumonTaskSchema>;

export type NewLumonAgent = z.infer<typeof insertLumonAgentSchema>;
export type NewLumonTask = z.infer<typeof insertLumonTaskSchema>;
