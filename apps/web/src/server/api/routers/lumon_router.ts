import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  authenticatedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { chats, chatMessages } from "@/server/db/schemas/chats_schemas";
import { eq, desc, and, isNull } from "drizzle-orm";
import { createIdGenerator, generateId } from "ai";
import { privyClient } from "@/app/lumon/kier/_utils/privyClient";
import { env } from "@/env";
import { SecretVaultWrapper } from "secretvaults";
import { orgConfig } from "@/app/lumon/kier/_utils/nillion.config.js";
import schema from "@/app/lumon/kier/_utils/lumon-task-schema.json";
import taskSchema from "@/app/lumon/kier/_utils/lumon-task-schema.json";
import {
  lumonTaskTypes,
  lumonTasks,
  lumonTaskSubmissions,
  lumonAgents,
  insertLumonTaskTypeSchema,
  insertLumonTaskSchema,
  insertLumonTaskSubmissionSchema,
  insertLumonAgentSchema,
} from "@/server/db/schemas/lumon_schemas";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

export const lumonRouter = createTRPCRouter({
  nilaiChat: publicProcedure
    .input(
      z.object({
        messages: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const messages = [
          {
            role: "user",
            content: input.messages,
          },
        ];

        const response = await fetch(
          `${process.env.NILAI_API_URL}/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NILAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "meta-llama/Llama-3.1-8B-Instruct",
              messages: messages,
              temperature: 0.2,
            }),
          },
        );

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Chat error:", error);
        return { error: "Failed to process chat request" };
      }
    }),

  mysteriousAndImportantWork: authenticatedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.string(),
            content: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await fetch(
          `${process.env.NILAI_API_URL}/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NILAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "meta-llama/Llama-3.1-8B-Instruct",
              messages: input.messages,
              temperature: 0.2,
            }),
          },
        );

        const data = await response.json();
        return "The work is important and mysterious!";
      } catch (error) {
        console.error("Error in mysteriousAndImportantWork procedure:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to do mysterious and important work",
          cause: error,
        });
      }
    }),

  nillionCreateSchema: authenticatedProcedure.mutation(async ({ ctx }) => {
    const org = new SecretVaultWrapper(
      orgConfig.nodes,
      orgConfig.orgCredentials,
    );
    await org.init();

    // create a new collectionschema
    const newSchema = await org.createSchema(schema, "Web3 Experience Survey");
    console.log("📚 New Schema:", newSchema);

    return newSchema;
  }),

  // New methods for Lumon tasks

  // Create a task type (like coldHarbor)
  createTaskType: authenticatedProcedure
    .input(insertLumonTaskTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create task types",
        });
      }

      try {
        const [taskType] = await ctx.db
          .insert(lumonTaskTypes)
          .values(input)
          .returning();
        return taskType;
      } catch (error) {
        console.error("Error creating task type:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create task type",
          cause: error,
        });
      }
    }),

  // Get all task types
  getTaskTypes: authenticatedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view task types",
      });
    }

    try {
      return await ctx.db.query.lumonTaskTypes.findMany({
        orderBy: (taskTypes, { desc }) => [desc(taskTypes.createdAt)],
      });
    } catch (error) {
      console.error("Error fetching task types:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch task types",
        cause: error,
      });
    }
  }),

  // Agent management endpoints

  // Create a new Lumon agent
  createAgent: authenticatedProcedure
    .input(insertLumonAgentSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create agents",
        });
      }

      try {
        const { id, address, chainType } = await privyClient.walletApi.create({
          chainType: "ethereum",
          // authorizationKeyIds: [env.PRIVY_WALLET_AUTHORIZATION_KEY_ID],
        });
        // Check if wallet address is already in use
        const existingAgent = await ctx.db.query.lumonAgents.findFirst({
          where: eq(lumonAgents.walletAddress, address),
        });

        if (existingAgent) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An agent with this wallet address already exists",
          });
        }

        const [agent] = await ctx.db
          .insert(lumonAgents)
          .values({
            ...input,
            walletAddress: address,
          })
          .returning();
        return agent;
      } catch (error) {
        console.error("Error creating agent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create agent",
          cause: error,
        });
      }
    }),

  // Get all Lumon agents
  getAgents: authenticatedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view agents",
      });
    }

    try {
      return await ctx.db.query.lumonAgents.findMany({
        orderBy: (agents, { desc }) => [desc(agents.createdAt)],
      });
    } catch (error) {
      console.error("Error fetching agents:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch agents",
        cause: error,
      });
    }
  }),

  // Get a single agent by ID
  getAgent: authenticatedProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view agent details",
        });
      }

      try {
        const agent = await ctx.db.query.lumonAgents.findFirst({
          where: eq(lumonAgents.id, input.agentId),
        });

        if (!agent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found",
          });
        }

        return agent;
      } catch (error) {
        console.error("Error fetching agent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch agent",
          cause: error,
        });
      }
    }),

  // Update an agent
  updateAgent: authenticatedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["active", "inactive", "maintenance"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update agents",
        });
      }

      try {
        const agent = await ctx.db.query.lumonAgents.findFirst({
          where: eq(lumonAgents.id, input.id),
        });

        if (!agent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found",
          });
        }

        const [updatedAgent] = await ctx.db
          .update(lumonAgents)
          .set({
            name: input.name,
            description: input.description,
            status: input.status,
            updatedAt: new Date(),
          })
          .where(eq(lumonAgents.id, input.id))
          .returning();

        return updatedAgent;
      } catch (error) {
        console.error("Error updating agent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update agent",
          cause: error,
        });
      }
    }),

  // Delete an agent
  deleteAgent: authenticatedProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete agents",
        });
      }

      try {
        // Check if agent exists
        const agent = await ctx.db.query.lumonAgents.findFirst({
          where: eq(lumonAgents.id, input.agentId),
        });

        if (!agent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found",
          });
        }

        // Check if agent has any tasks
        const tasks = await ctx.db.query.lumonTasks.findMany({
          where: eq(lumonTasks.agentId, input.agentId),
        });

        if (tasks.length > 0) {
          // Option 1: Prevent deletion if agent has tasks
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot delete agent with assigned tasks",
          });

          // Option 2: Delete all associated tasks first (uncomment if you prefer this approach)
          /*
          await ctx.db
            .delete(lumonTasks)
            .where(eq(lumonTasks.agentId, input.agentId));
          */
        }

        // Delete the agent
        await ctx.db
          .delete(lumonAgents)
          .where(eq(lumonAgents.id, input.agentId));

        return { success: true };
      } catch (error) {
        console.error("Error deleting agent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete agent",
          cause: error,
        });
      }
    }),

  // Get agent tasks summary
  getAgentTasksSummary: authenticatedProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view task summaries",
        });
      }

      try {
        const agent = await ctx.db.query.lumonAgents.findFirst({
          where: eq(lumonAgents.id, input.agentId),
        });

        if (!agent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found",
          });
        }

        // Get all tasks for this agent
        const tasks = await ctx.db.query.lumonTasks.findMany({
          where: eq(lumonTasks.agentId, input.agentId),
        });

        // Calculate summary
        const summary = {
          total: tasks.length,
          assigned: tasks.filter((task) => task.status === "assigned").length,
          inProgress: tasks.filter((task) => task.status === "in_progress")
            .length,
          completed: tasks.filter((task) => task.status === "completed").length,
          rejected: tasks.filter((task) => task.status === "rejected").length,
        };

        return summary;
      } catch (error) {
        console.error("Error fetching agent tasks summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch agent tasks summary",
          cause: error,
        });
      }
    }),

  // Assign a task to an agent (update the existing endpoint)
  assignTask: authenticatedProcedure
    .input(
      z.object({
        taskTypeId: z.string().uuid(),
        agentId: z.string().uuid(), // Changed from profileId to agentId
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to assign tasks",
        });
      }

      try {
        // Check if task type exists
        const taskType = await ctx.db.query.lumonTaskTypes.findFirst({
          where: eq(lumonTaskTypes.id, input.taskTypeId),
        });

        if (!taskType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task type not found",
          });
        }

        // Check if agent exists
        const agent = await ctx.db.query.lumonAgents.findFirst({
          where: eq(lumonAgents.id, input.agentId),
        });

        if (!agent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found",
          });
        }

        // Create the task
        const [task] = await ctx.db
          .insert(lumonTasks)
          .values({
            taskTypeId: input.taskTypeId,
            agentId: input.agentId, // Changed from profileId to agentId
            dueDate: input.dueDate,
          })
          .returning();

        return task;
      } catch (error) {
        console.error("Error assigning task:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign task",
          cause: error,
        });
      }
    }),

  // Get tasks assigned to an agent (update the existing endpoint)
  getAgentTasks: authenticatedProcedure
    .input(
      z.object({
        agentId: z.string().uuid(), // Changed from profileId to agentId
        status: z
          .enum(["assigned", "in_progress", "completed", "rejected"])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view tasks",
        });
      }

      try {
        const whereClause = input.status
          ? and(
              eq(lumonTasks.agentId, input.agentId),
              eq(lumonTasks.status, input.status),
            )
          : eq(lumonTasks.agentId, input.agentId);

        return await ctx.db.query.lumonTasks.findMany({
          where: whereClause,
          with: {
            taskType: true,
            agent: true,
          },
          orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
        });
      } catch (error) {
        console.error("Error fetching agent tasks:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch agent tasks",
          cause: error,
        });
      }
    }),

  // Submit a task to Nillion
  submitTask: authenticatedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        data: z.record(z.any()), // The task data to be encrypted and stored in Nillion
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to submit tasks",
        });
      }

      try {
        // Get the task with related data
        const task = await ctx.db.query.lumonTasks.findFirst({
          where: eq(lumonTasks.id, input.taskId),
          with: {
            taskType: true,
            agent: true, // Changed from profile to agent
          },
        });

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        // Initialize Nillion
        const org = new SecretVaultWrapper(
          orgConfig.nodes,
          orgConfig.orgCredentials,
        );
        await org.init();

        // Create a record in Nillion
        const recordId = uuidv4();
        const record = {
          _id: recordId,
          taskId: task.id,
          taskTypeId: task.taskTypeId,
          agentId: task.agentId, // Changed from profileId to agentId
          agentWalletAddress: task.agent.walletAddress, // Added agent wallet address
          submittedAt: new Date().toISOString(),
          data: {
            "%share": JSON.stringify(input.data),
          },
          metadata: {
            taskName: task.taskType.name,
            agentName: task.agent.name, // Changed from profile.name to agent.name
            ...input.metadata,
          },
        };

        // Store the record in Nillion
        await org.storeRecord(taskSchema.name, record);

        // Update the task status and record ID
        await ctx.db
          .update(lumonTasks)
          .set({
            status: "completed",
            completedAt: new Date(),
            nillionRecordId: recordId,
            updatedAt: new Date(),
          })
          .where(eq(lumonTasks.id, input.taskId));

        return { success: true, recordId };
      } catch (error) {
        console.error("Error submitting task:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit task",
          cause: error,
        });
      }
    }),

  // Initialize Lumon task schema in Nillion
  initializeTaskSchema: authenticatedProcedure.mutation(async ({ ctx }) => {
    try {
      const org = new SecretVaultWrapper(
        orgConfig.nodes,
        orgConfig.orgCredentials,
      );
      await org.init();

      // Create the task schema in Nillion
      const newSchema = await org.createSchema(taskSchema, taskSchema.name);
      console.log("📚 New Lumon Task Schema:", newSchema);

      return newSchema;
    } catch (error) {
      console.error("Error initializing task schema:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to initialize task schema",
        cause: error,
      });
    }
  }),

  // Get a task submission from Nillion
  getTaskSubmission: authenticatedProcedure
    .input(
      z.object({
        nillionRecordId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view task submissions",
        });
      }

      try {
        const org = new SecretVaultWrapper(
          orgConfig.nodes,
          orgConfig.orgCredentials,
        );
        await org.init();

        // Retrieve the record from Nillion
        const record = await org.retrieveRecord(
          taskSchema.name,
          input.nillionRecordId,
        );

        if (!record) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task submission not found in Nillion",
          });
        }

        // Parse the shared data
        if (record.data && record.data["%share"]) {
          record.data = JSON.parse(record.data["%share"]);
        }

        return record;
      } catch (error) {
        console.error("Error retrieving task submission:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve task submission",
          cause: error,
        });
      }
    }),

  // Update task status
  updateTaskStatus: authenticatedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        status: z.enum(["assigned", "in_progress", "completed", "rejected"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update tasks",
        });
      }

      try {
        const task = await ctx.db.query.lumonTasks.findFirst({
          where: eq(lumonTasks.id, input.taskId),
        });

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        await ctx.db
          .update(lumonTasks)
          .set({
            status: input.status,
            updatedAt: new Date(),
          })
          .where(eq(lumonTasks.id, input.taskId));

        return { success: true };
      } catch (error) {
        console.error("Error updating task status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task status",
          cause: error,
        });
      }
    }),
});
