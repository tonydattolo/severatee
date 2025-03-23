import { PrivyWalletProvider } from "@coinbase/agentkit";
import {
  ActionProvider,
  WalletProvider,
  Network,
  CreateAction,
} from "@coinbase/agentkit";
import { z } from "zod";
import { api } from "@/trpc/server";
import { SecretVaultWrapper } from "secretvaults";
import { orgConfig } from "@/app/lumon/kier/_utils/nillion.config.js";
import taskSchema from "@/app/lumon/kier/_utils/lumon-task-schema.json";

// Define schemas for our actions
const TaskSchema = z.object({
  name: z.string().min(1),
  instructions: z.string().min(1),
  agentId: z.string().uuid(),
  dueDate: z.date().optional(),
  status: z
    .enum(["assigned", "in_progress", "completed", "rejected"])
    .default("assigned"),
  progress: z.number().min(0).max(100).default(0),
});

const CompleteTaskSchema = z.object({
  taskId: z.string().uuid(),
  answer: z.string().min(1),
  progress: z.number().min(0).max(100),
});

const UpdateTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["assigned", "in_progress", "completed", "rejected"]),
});

const CreateAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "maintenance"]).default("active"),
});

const ViewAssignedTasksSchema = z.object({
  agentId: z.string().uuid(),
  status: z
    .enum(["assigned", "in_progress", "completed", "rejected"])
    .optional(),
});

// Add new schema for retrieving vault data
const RetrieveVaultDataSchema = z.object({
  recordId: z.string(),
  taskId: z.string().uuid(),
});

// Manager Agent Action Provider
class LumonManagerActionProvider extends ActionProvider<WalletProvider> {
  constructor() {
    super("lumon-manager-action-provider", []);
  }

  @CreateAction({
    name: "view-agents",
    description: "View all Lumon agents",
    schema: z.object({}),
  })
  async viewAgents(): Promise<string> {
    const agents = await api.lumon.getAgents();
    return JSON.stringify(agents);
  }

  @CreateAction({
    name: "create-agent",
    description: "Create a new Lumon agent",
    schema: CreateAgentSchema,
  })
  async createAgent(
    _walletProvider: PrivyWalletProvider,
    args: z.infer<typeof CreateAgentSchema>,
  ): Promise<string> {
    const agent = await api.lumon.createAgent(args);
    return `Created agent ${agent.name} with ID ${agent.id}`;
  }

  @CreateAction({
    name: "create-and-assign-task",
    description: "Create a task and assign it to an agent",
    schema: TaskSchema,
  })
  async createAndAssignTask(
    _walletProvider: PrivyWalletProvider,
    args: z.infer<typeof TaskSchema>,
  ): Promise<string> {
    const task = await api.lumon.createTask(args);
    return `Created and assigned task ${task.name} to agent ${args.agentId}`;
  }

  @CreateAction({
    name: "view-all-tasks",
    description: "View all tasks with optional filters",
    schema: z
      .object({
        status: z
          .enum(["assigned", "in_progress", "completed", "rejected"])
          .optional(),
        agentId: z.string().uuid().optional(),
      })
      .optional(),
  })
  async viewAllTasks(
    _walletProvider: PrivyWalletProvider,
    args?: { status?: string; agentId?: string },
  ): Promise<string> {
    const tasks = await api.lumon.getAllTasks(args);
    return JSON.stringify(tasks);
  }

  supportsNetwork = (network: Network) => true;
}

// Worker Agent Action Provider
class LumonWorkerActionProvider extends ActionProvider<WalletProvider> {
  constructor() {
    super("lumon-worker-action-provider", []);
  }

  @CreateAction({
    name: "complete-task",
    description: "Complete a task with an answer",
    schema: CompleteTaskSchema,
  })
  async completeTask(
    _walletProvider: PrivyWalletProvider,
    args: z.infer<typeof CompleteTaskSchema>,
  ): Promise<string> {
    const result = await api.lumon.mysteriousAndImportantWork({
      message: args.answer,
      taskId: args.taskId,
    });
    return `Task ${args.taskId} completed successfully with record ID ${result.recordId}`;
  }

  @CreateAction({
    name: "update-task-status",
    description: "Update the status of a task",
    schema: UpdateTaskStatusSchema,
  })
  async updateTaskStatus(
    _walletProvider: PrivyWalletProvider,
    args: z.infer<typeof UpdateTaskStatusSchema>,
  ): Promise<string> {
    await api.lumon.updateTaskStatus(args);
    return `Updated task ${args.taskId} status to ${args.status}`;
  }

  @CreateAction({
    name: "view-assigned-tasks",
    description: "View tasks assigned to the agent",
    schema: ViewAssignedTasksSchema,
  })
  async viewAssignedTasks(
    _walletProvider: PrivyWalletProvider,
    args: z.infer<typeof ViewAssignedTasksSchema>,
  ): Promise<string> {
    const tasks = await api.lumon.getAgentTasks(args);
    return JSON.stringify(tasks);
  }

  @CreateAction({
    name: "chat-with-nilai",
    description: "Chat with Nilai about a task",
    schema: z.object({
      taskId: z.string().uuid(),
      message: z.string(),
    }),
  })
  async mysteriousAndImportantWork(
    _walletProvider: PrivyWalletProvider,
    args: { taskId: string; message: string },
  ): Promise<string> {
    const response = await api.lumon.mysteriousAndImportantWork({
      message: args.message,
      taskId: args.taskId,
    });
    return response.answer || "No response received";
  }

  @CreateAction({
    name: "retrieve-vault-data",
    description: "Retrieve and decrypt data from Nillion SecretVault",
    schema: RetrieveVaultDataSchema,
  })
  async retrieveVaultData(
    _walletProvider: PrivyWalletProvider,
    args: z.infer<typeof RetrieveVaultDataSchema>,
  ): Promise<string> {
    try {
      // Initialize Nillion
      const org = new SecretVaultWrapper(
        orgConfig.nodes,
        orgConfig.orgCredentials,
      );
      await org.init();

      // Get the latest schema
      const latestSchema = await api.lumon.getLatestNillionSchema();
      if (!latestSchema) {
        throw new Error("No Nillion schema found");
      }

      // Retrieve the record from Nillion
      const record = await org.retrieveRecord(
        latestSchema.schemaId,
        args.recordId,
      );

      if (!record) {
        throw new Error("Record not found in vault");
      }

      // Parse the shared data
      let decryptedData;
      if (record.data && record.data["%share"]) {
        decryptedData = JSON.parse(record.data["%share"]);
      }

      // Return the data in a format suitable for the next action
      return JSON.stringify({
        success: true,
        taskId: args.taskId,
        agentWalletAddress: record.agentWalletAddress,
        data: decryptedData,
        metadata: record.metadata,
      });
    } catch (error) {
      console.error("Error retrieving vault data:", error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @CreateAction({
    name: "verify-and-prepare-transfer",
    description: "Verify vault data and prepare for transfer",
    schema: z.object({
      vaultDataString: z.string(),
    }),
  })
  async verifyAndPrepareTransfer(
    _walletProvider: PrivyWalletProvider,
    args: { vaultDataString: string },
  ): Promise<string> {
    try {
      const vaultData = JSON.parse(args.vaultDataString);

      if (!vaultData.success) {
        throw new Error("Invalid vault data");
      }

      // Verify the task exists and is completed
      const task = await api.lumon.getTask({ taskId: vaultData.taskId });

      if (!task || task.status !== "completed") {
        throw new Error("Task not found or not completed");
      }

      // Return the wallet address for the transfer
      return JSON.stringify({
        success: true,
        recipientAddress: vaultData.agentWalletAddress,
        taskId: vaultData.taskId,
        // Add any other data needed for the transfer
        amount: "0.1", // Example amount, adjust as needed
        token: "ETH", // Example token, adjust as needed
      });
    } catch (error) {
      console.error("Error preparing transfer:", error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  supportsNetwork = (network: Network) => true;
}

export const managerActionProvider = () => new LumonManagerActionProvider();
export const workerActionProvider = () => new LumonWorkerActionProvider();

// Export the action providers
export { LumonManagerActionProvider, LumonWorkerActionProvider };
