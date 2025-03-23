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
// import schema from "@/app/lumon/kier/_utils/lumon-task-schema.json";
import taskSchema from "@/app/lumon/kier/_utils/lumon-task-schema.json";
import {
  lumonTasks,
  lumonAgents,
  insertLumonTaskSchema,
  insertLumonAgentSchema,
} from "@/server/db/schemas/lumon_schemas";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import testSchema from "@/app/lumon/kier/_utils/nillion.schema.example.json";

const nilaiClient = new OpenAI({
  baseURL: "https://nilai-a779.nillion.network/v1",
  apiKey: env.NILAI_API_KEY,
});

export const lumonRouter = createTRPCRouter({
  mysteriousAndImportantWork: authenticatedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const task = await ctx.db.query.lumonTasks.findFirst({
          where: eq(lumonTasks.id, input.taskId),
          with: {
            agent: true,
          },
        });

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        const instructions = `
        You are a helpful assistant that can answer questions and help with tasks.
        You are given a task to complete and you need to answer the user's question.
        The task is: ${task?.instructions || "The work is mysterious and important, give us a random Severance show on AppleTv+ factoid."}
        `;

        const response = await nilaiClient.chat.completions.create({
          model: "meta-llama/Llama-3.1-8B-Instruct",
          messages: [
            {
              role: "system",
              content: instructions,
            },
            {
              role: "user",
              content: input.message,
            },
          ],
          stream: false,
        });

        // Every SecretLLM response includes a cryptographic signature for verification
        console.log(`Signature: ${response.signature}`);
        console.log(`Response: ${response.choices[0]?.message.content}`);
        const signature = response.signature;
        const answer = response.choices[0]?.message.content;

        if (!signature || !answer) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get signature or answer",
          });
        }

        await ctx.db
          .update(lumonTasks)
          .set({
            signature,
            answer,
            status: "completed",
            progress: 100,
            completedAt: new Date(),
          })
          .where(eq(lumonTasks.id, input.taskId));

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
          agentId: task.agentId,
          agentWalletAddress: task?.agent?.walletAddress,
          submittedAt: new Date().toISOString(),
          data: {
            "%share": JSON.stringify(input.data),
          },
          metadata: {
            taskName: task.name,
            agentName: task?.agent?.name,
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
            progress: 100,
          })
          .where(eq(lumonTasks.id, input.taskId));

        return { signature, answer, success: true };
      } catch (error) {
        console.error("Chat error:", error);
        return { error: "Failed to process chat request" };
      }
    }),

  nillionCreateSchema: authenticatedProcedure.mutation(async ({ ctx }) => {
    try {
      const org = new SecretVaultWrapper(
        orgConfig.nodes,
        orgConfig.orgCredentials,
      );
      await org.init();

      // create a new collectionschema
      const newSchema = await org.createSchema(taskSchema, "Lumon Task Schema");
      console.log("Lumon Task Schema created:", newSchema);

      return newSchema;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create Nillion schema: ${error}`,
        cause: error,
      });
    }
  }),

  nillionCreateTestSchema: authenticatedProcedure.mutation(async ({ ctx }) => {
    try {
      const org = new SecretVaultWrapper(
        orgConfig.nodes,
        orgConfig.orgCredentials,
      );
      await org.init();

      const newSchema = await org.createSchema(testSchema, "Test Schema");
      console.log("📚 Test Schema:", newSchema);

      return newSchema;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create Nillion schema: ${error}`,
        cause: error,
      });
    }
  }),

  // Get all task types
  getTasks: authenticatedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view task types",
      });
    }

    try {
      return await ctx.db.query.lumonTasks.findMany({
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
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
          for (const task of tasks) {
            await ctx.db
              .update(lumonTasks)
              .set({
                status: "unassigned",
                agentId: null,
              })
              .where(eq(lumonTasks.id, task.id));
          }
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
  checkCompletedWorkFromNillion: authenticatedProcedure
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

  // Get all tasks with optional filters
  getAllTasks: authenticatedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["assigned", "in_progress", "completed", "rejected"])
            .optional(),
          agentId: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view tasks",
        });
      }

      try {
        let whereClause = undefined;

        if (input) {
          const conditions = [];
          if (input.status)
            conditions.push(eq(lumonTasks.status, input.status));
          if (input.agentId)
            conditions.push(eq(lumonTasks.agentId, input.agentId));

          if (conditions.length > 0) {
            whereClause = and(...conditions);
          }
        }

        return await ctx.db.query.lumonTasks.findMany({
          where: whereClause,
          with: {
            agent: true,
          },
          orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
        });
      } catch (error) {
        console.error("Error fetching tasks:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tasks",
          cause: error,
        });
      }
    }),

  // Create a new task
  createTask: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        instructions: z.string().min(1),
        agentId: z.string().uuid(),
        dueDate: z.date().optional(),
        status: z
          .enum(["assigned", "in_progress", "completed", "rejected"])
          .default("assigned"),
        progress: z.number().min(0).max(100).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create tasks",
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

        // Create the task
        const [task] = await ctx.db
          .insert(lumonTasks)
          .values({
            name: input.name,
            instructions: input.instructions,
            agentId: input.agentId,
            dueDate: input.dueDate,
            status: input.status,
            progress: input.progress,
          })
          .returning();

        return task;
      } catch (error) {
        console.error("Error creating task:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create task",
          cause: error,
        });
      }
    }),

  // Submit a task answer
  submitTaskAnswer: authenticatedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        answer: z.string().min(1),
        progress: z.number().min(0).max(100),
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
        const task = await ctx.db.query.lumonTasks.findFirst({
          where: eq(lumonTasks.id, input.taskId),
          with: {
            agent: true,
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
          agentId: task.agentId,
          agentWalletAddress: task.agent.walletAddress,
          submittedAt: new Date().toISOString(),
          data: {
            "%share": JSON.stringify({ answer: input.answer }),
          },
          metadata: {
            taskName: task.name,
            agentName: task.agent.name,
          },
        };

        // Store the record in Nillion
        await org.storeRecord(schema.name, record);

        // Update the task
        await ctx.db
          .update(lumonTasks)
          .set({
            status: "completed",
            completedAt: new Date(),
            nillionRecordId: recordId,
            answer: input.answer,
            progress: input.progress,
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
});
