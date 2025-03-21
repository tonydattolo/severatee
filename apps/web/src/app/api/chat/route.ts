import { openai } from "@ai-sdk/openai";
import { appendResponseMessages, createIdGenerator, streamText } from "ai";
import { db } from "@/server/db/db";
import { chats, chatMessages } from "@/server/db/schemas/chats_schemas";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { messages, id } = await req.json();

    // Update chat status to streaming
    await db
      .update(chats)
      .set({
        status: "streaming",
        updatedAt: new Date(),
      })
      .where(eq(chats.id, id));

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages,
      // experimental_generateMessageId: createIdGenerator({
      //   prefix: "msg_",
      //   size: 16,
      // }),
      async onFinish({ response }) {
        // Get all messages including the new response
        const updatedMessages = appendResponseMessages({
          messages,
          responseMessages: response.messages,
        });

        // Delete existing messages for this chat
        await db.delete(chatMessages).where(eq(chatMessages.chatId, id));

        // Insert all messages
        if (updatedMessages.length > 0) {
          await db.insert(chatMessages).values(
            updatedMessages.map((message) => ({
              id: message.id,
              chatId: id,
              role: message.role,
              content: message.content,
              createdAt: message.createdAt || new Date(),
            })),
          );
        }

        // Update chat status to complete
        await db
          .update(chats)
          .set({
            status: "complete",
            updatedAt: new Date(),
          })
          .where(eq(chats.id, id));
      },
    });

    // Consume the stream to ensure it runs to completion even if client disconnects
    result.consumeStream();

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
