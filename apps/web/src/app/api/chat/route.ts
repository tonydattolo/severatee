import { openai } from "@ai-sdk/openai";
import { appendResponseMessages, createIdGenerator, streamText } from "ai";
import { db } from "@/server/db/db";
import { chats, chatMessages } from "@/server/db/schemas/chats_schemas";
import { eq } from "drizzle-orm";
import { env } from "@/env";

export async function POST(req: Request) {
  const { messages, id } = await req.json();
  console.log("API route hit:", { messages, id });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a helpful assistant that can answer questions and help with tasks.",
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
        await db.insert(chatMessages).values({
          id: lastMessage.id as string,
          chatId: id,
          content:
            typeof lastMessage.content === "string" ? lastMessage.content : "",
          role: lastMessage.role as "assistant",
          createdAt: new Date(),
        });
      }
    },
  });
  console.log("result", result);

  // Consume the stream to ensure it runs to completion even if client disconnects
  result.consumeStream();

  return result.toDataStreamResponse();
}
