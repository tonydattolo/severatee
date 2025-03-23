import { openai } from "@ai-sdk/openai";
import {
  appendResponseMessages,
  createIdGenerator,
  generateId,
  generateText,
  streamText,
} from "ai";
import { db } from "@/server/db/db";
import { chats, chatMessages } from "@/server/db/schemas/chats_schemas";
import { eq } from "drizzle-orm";
import { env } from "@/env";

import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
// import { privyWalletProvider } from "@/app/lumon/kier/_utils/privyProvider";
import {
  AgentKit,
  cdpApiActionProvider,
  erc721ActionProvider,
  pythActionProvider,
  walletActionProvider,
  CdpWalletProvider,
} from "@coinbase/agentkit";

import { PrivyWalletProvider, PrivyWalletConfig } from "@coinbase/agentkit";
import { privyWalletProvider } from "@/app/utils/privy/privyProvider";

export async function POST(req: Request) {
  const { messages, id } = await req.json();
  console.log("API route hit:", { messages, id });

  const agentKit = await AgentKit.from({
    // cdpApiKeyName: env.CDP_API_KEY_NAME,
    // cdpApiKeyPrivateKey: env.CDP_API_KEY_PRIVATE_KEY,
    walletProvider: privyWalletProvider,
    actionProviders: [
      cdpApiActionProvider({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
      }),
      erc721ActionProvider(),
      pythActionProvider(),
      walletActionProvider(),
    ],
  });

  const tools = await getVercelAITools(agentKit);

  const stream = streamText({
    tools,
    maxSteps: 10,
    model: openai("gpt-4o-mini"),
    system: `You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are
      empowered to interact onchain using your tools. If you ever need funds, you can request them from the
      faucet if you are on network ID 'base-sepolia'. If not, you can provide your wallet details and request
      funds from the user. Before executing your first action, get the wallet details to see what network
      you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone
      asks you to do something you can't do with your currently available tools, you must say so, and
      encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to
      docs.cdp.coinbase.com for more information. Be concise and helpful with your responses. Refrain from
      restating your tools' descriptions unless it is explicitly requested.`,
    messages,
    experimental_generateMessageId: createIdGenerator({
      prefix: "msg",
      separator: "_",
      size: 16,
    }),
    async onFinish({ response }) {
      console.log("Stream finished:", response);
      const lastMessage = response.messages[response.messages.length - 1];
      if (lastMessage) {
        // Handle the content array structure
        const content =
          lastMessage.content[0]?.text ?? "*error getting content*";
        await db.insert(chatMessages).values({
          id: lastMessage.id as string,
          chatId: id,
          content,
          role: lastMessage.role as "assistant",
          createdAt: new Date(),
        });
      }
    },
    onError(error) {
      console.error("Error:", error);
    },
  });
  // Consume the stream to ensure it runs to completion even if client disconnects
  stream.consumeStream();

  return stream.toDataStreamResponse();
}
