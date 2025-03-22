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

// Task types like coldHarbor, etc.
export const lumonTaskTypes = pgTable("lumon_task_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Task instances assigned to agents
export const lumonTasks = pgTable("lumon_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskTypeId: uuid("task_type_id")
    .references(() => lumonTaskTypes.id)
    .notNull(),
  // Change from profileId to agentId
  agentId: uuid("agent_id")
    .references(() => lumonAgents.id)
    .notNull(),
  status: varchar("status", { length: 20 }).notNull().default("assigned"), // assigned, in_progress, completed, rejected
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  nillionRecordId: varchar("nillion_record_id", { length: 255 }),
});

// Task submissions stored in Nillion
export const lumonTaskSubmissions = pgTable("lumon_task_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .references(() => lumonTasks.id)
    .notNull(),
  nillionRecordId: varchar("nillion_record_id", { length: 255 }).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Any additional metadata about the submission
});

// Relations
export const lumonAgentsRelations = relations(lumonAgents, ({ many }) => ({
  tasks: many(lumonTasks),
}));

export const lumonTaskTypesRelations = relations(
  lumonTaskTypes,
  ({ many }) => ({
    tasks: many(lumonTasks),
  }),
);

export const lumonTasksRelations = relations(lumonTasks, ({ one, many }) => ({
  taskType: one(lumonTaskTypes, {
    fields: [lumonTasks.taskTypeId],
    references: [lumonTaskTypes.id],
  }),
  agent: one(lumonAgents, {
    fields: [lumonTasks.agentId],
    references: [lumonAgents.id],
  }),
  submissions: many(lumonTaskSubmissions),
}));

export const lumonTaskSubmissionsRelations = relations(
  lumonTaskSubmissions,
  ({ one }) => ({
    task: one(lumonTasks, {
      fields: [lumonTaskSubmissions.taskId],
      references: [lumonTasks.id],
    }),
  }),
);

// Zod schemas for validation
export const insertLumonAgentSchema = createInsertSchema(lumonAgents);
export const selectLumonAgentSchema = createSelectSchema(lumonAgents);

export const insertLumonTaskTypeSchema = createInsertSchema(lumonTaskTypes);
export const selectLumonTaskTypeSchema = createSelectSchema(lumonTaskTypes);

export const insertLumonTaskSchema = createInsertSchema(lumonTasks);
export const selectLumonTaskSchema = createSelectSchema(lumonTasks);

export const insertLumonTaskSubmissionSchema =
  createInsertSchema(lumonTaskSubmissions);
export const selectLumonTaskSubmissionSchema =
  createSelectSchema(lumonTaskSubmissions);

export type LumonAgent = z.infer<typeof selectLumonAgentSchema>;
export type LumonTaskType = z.infer<typeof selectLumonTaskTypeSchema>;
export type LumonTask = z.infer<typeof selectLumonTaskSchema>;
export type LumonTaskSubmission = z.infer<
  typeof selectLumonTaskSubmissionSchema
>;
export type NewLumonAgent = z.infer<typeof insertLumonAgentSchema>;
export type NewLumonTaskType = z.infer<typeof insertLumonTaskTypeSchema>;
export type NewLumonTask = z.infer<typeof insertLumonTaskSchema>;
export type NewLumonTaskSubmission = z.infer<
  typeof insertLumonTaskSubmissionSchema
>;
