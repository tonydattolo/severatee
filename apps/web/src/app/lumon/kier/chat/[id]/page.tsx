import { Suspense } from "react";
import { api } from "@/trpc/server";
import ChatUI from "@/app/lumon/kier/_components/chat-ui";
import LoadingScreen from "@/components/common/loading-screen";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Message } from "ai";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const chatWithMessages = await api.chats.getChatById({ id });

  if (!chatWithMessages) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Alert variant="destructive">
          <AlertTitle>Error fetching chat</AlertTitle>
          <AlertDescription>Error fetching chat</AlertDescription>
        </Alert>
      </div>
    );
  }

  const messages: Message[] = chatWithMessages.messages.map((message) => ({
    id: message.id,
    content: message.content ?? "",
    role: (message.role || "user") as "user" | "assistant" | "system" | "data",
  }));
  console.log("messages in page", messages);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ChatUI
        id={chatWithMessages.id}
        initialMessages={messages}
        chat={chatWithMessages}
      />
    </Suspense>
  );
}
