import { PrivyWalletProvider, PrivyWalletConfig } from "@coinbase/agentkit";
import { privyWalletProvider } from "@/app/lumon/kier/_utils/privyClient";
import {
  ActionProvider,
  WalletProvider,
  Network,
  CreateAction,
  AgentKit,
} from "@coinbase/agentkit";
import { z } from "zod";

// // Configure Wallet Provider
// const config: PrivyWalletConfig = {
//   appId: "PRIVY_APP_ID",
//   appSecret: "PRIVY_APP_SECRET",
//   chainId: "84532", // optional, defaults to 84532 (base-sepolia)
//   walletId: "PRIVY_WALLET_ID", // optional, otherwise a new wallet will be created
//   authorizationPrivateKey: PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY, // optional, required if your account is using authorization keys
//   authorizationKeyId: PRIVY_WALLET_AUTHORIZATION_KEY_ID, // optional, only required to create a new wallet if walletId is not provided
// };

// export const privyWalletProvider =
//   await PrivyWalletProvider.configureWithWallet(config);

// Define schemas for our actions
const TaskSchema = z.object({
  taskId: z.string(),
  description: z.string(),
  assignedTo: z.string(),
});

const CompleteTaskSchema = z.object({
  taskId: z.string(),
  solution: z.string(),
});

const RequestPaymentSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
});

const PayoutSchema = z.object({
  agentId: z.string(),
  amount: z.string(), // Amount in wei
  taskId: z.string(),
});

// Manager Agent Action Provider
class ManagerActionProvider extends ActionProvider<WalletProvider> {
  constructor() {
    super("manager-action-provider", []);
  }

  @CreateAction({
    name: "assign-task",
    description: "Assign a task to a worker agent",
    schema: TaskSchema,
  })
  async assignTask(
    walletProvider: PrivyWalletProvider,
    args: z.infer<typeof TaskSchema>,
  ): Promise<string> {
    // In a real implementation, we would store the task in a database
    console.log(`Assigning task ${args.taskId} to agent ${args.assignedTo}`);

    // For now, we'll just return a success message
    return `Task ${args.taskId} assigned to ${args.assignedTo}`;
  }

  @CreateAction({
    name: "payout-worker",
    description: "Pay a worker agent for completing a task",
    schema: PayoutSchema,
  })
  async payoutWorker(
    walletProvider: PrivyWalletProvider,
    args: z.infer<typeof PayoutSchema>,
  ): Promise<string> {
    try {
      // This is a placeholder for actual verification logic
      const isTaskComplete = true; // Replace with actual verification

      if (!isTaskComplete) {
        return `Task ${args.taskId} is not complete. Payment rejected.`;
      }

      // Use the transfer action from the wallet provider
      const result = await walletProvider.transfer({
        to: args.agentId,
        amount: args.amount,
        // You can add other parameters like token address for ERC20 transfers
      });

      return `Payment of ${args.amount} sent to ${args.agentId} for task ${args.taskId}. Transaction: ${result.hash}`;
    } catch (error) {
      console.error("Payment failed:", error);
      return `Payment failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  supportsNetwork = (network: Network) => true;
}

// Worker Agent Action Provider
class WorkerActionProvider extends ActionProvider<WalletProvider> {
  constructor() {
    super("worker-action-provider", []);
  }

  @CreateAction({
    name: "complete-task",
    description: "Complete an assigned task",
    schema: CompleteTaskSchema,
  })
  async completeTask(
    walletProvider: PrivyWalletProvider,
    args: z.infer<typeof CompleteTaskSchema>,
  ): Promise<string> {
    // In a real implementation, we would update the task status in a database
    console.log(
      `Completing task ${args.taskId} with solution: ${args.solution}`,
    );

    // For now, we'll just return a success message
    return `Task ${args.taskId} completed successfully`;
  }

  @CreateAction({
    name: "request-payment",
    description: "Request payment for a completed task",
    schema: RequestPaymentSchema,
  })
  async requestPayment(
    walletProvider: PrivyWalletProvider,
    args: z.infer<typeof RequestPaymentSchema>,
  ): Promise<string> {
    // In a real implementation, we would:
    // 1. Verify the task exists and is assigned to this agent
    // 2. Verify the task is complete
    // 3. Submit a payment request

    console.log(
      `Agent ${args.agentId} requesting payment for task ${args.taskId}`,
    );

    // For now, we'll just return a success message
    return `Payment requested for task ${args.taskId}`;
  }

  supportsNetwork = (network: Network) => true;
}

export const managerActionProvider = () => new ManagerActionProvider();
export const workerActionProvider = () => new WorkerActionProvider();

// Create AgentKit instance
const agentKit = new AgentKit({
  cdpApiKeyName: process.env.CDP_API_KEY_NAME!,
  cdpApiKeyPrivate: process.env.CDP_API_KEY_PRIVATE!,
  walletProvider: privyWalletProvider,
  actionProviders: [managerActionProvider(), workerActionProvider()],
});

// Create manager agent
const createManagerAgent = async (name: string) => {
  return await agentKit.createAgent({
    name: `Lumon Manager: ${name}`,
    description:
      "Manager agent that assigns tasks and handles payments for the severed floor at Lumon",
    actions: [managerActionProvider()],
  });
};

// Create worker agent
const createWorkerAgent = async (name: string) => {
  return await agentKit.createAgent({
    name: `Lumon Worker: ${name}`,
    description:
      "Worker agent that completes tasks on the severed floor at Lumon",
    actions: [workerActionProvider()],
  });
};

// Example usage (commented out for now)
// Create a manager agent
const managerAgent = await createManagerAgent("Milkshake");

// Create worker agents
const markWorker = await createWorkerAgent("Mark");
const hellyWorker = await createWorkerAgent("Helly");
const irvingWorker = await createWorkerAgent("Irving");
const dylanWorker = await createWorkerAgent("Dylan");

// Export functions for external use
export { createManagerAgent, createWorkerAgent };
