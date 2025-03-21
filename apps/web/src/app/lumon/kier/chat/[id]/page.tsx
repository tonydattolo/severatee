import { Suspense } from "react";
import { notFound } from "next/navigation";
import { api } from "@/trpc/server";
import ChatUI from "@/app/lumon/kier/_components/chat-ui";
import { Message, createIdGenerator } from "ai";

export default async function ChatPage({ params }: { params: { id: string } }) {
  try {
    const chat = await api.chats.getChatById({ id: params.id });

    // Convert DB messages to AI SDK Message format
    const initialMessages: Message[] = chat.messages.map((msg) => ({
      id: msg.id || createIdGenerator({ prefix: "msg_", size: 16 })(),
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
      createdAt: msg.createdAt,
    }));

    return (
      <Suspense fallback={<div>Loading chat...</div>}>
        <ChatUI
          id={chat.id}
          initialMessages={initialMessages}
          chatTitle={chat.title || "New Chat"}
        />
      </Suspense>
    );
  } catch (error) {
    return notFound();
  }
}
