"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Message, useChat } from "@ai-sdk/react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
  CircleUserRound,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { createIdGenerator } from "ai";

interface ChatUIProps {
  id: string;
  initialMessages?: Message[];
  chatTitle?: string;
}

export default function ChatUI({
  id,
  initialMessages = [],
  chatTitle = "New Chat",
}: ChatUIProps) {
  const router = useRouter();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const utils = api.useUtils();
  const chatStatus = api.chats.getChatById.useQuery({ id }, { enabled: false });

  // Check for pending message from Kier page
  useEffect(() => {
    const pendingMessage = sessionStorage.getItem("pendingMessage");
    if (pendingMessage) {
      // Clear the pending message
      sessionStorage.removeItem("pendingMessage");

      // Send the message
      append({
        id: `msg_user_${Date.now()}`,
        content: pendingMessage,
        role: "user",
        createdAt: new Date(),
      });
    }
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
  } = useChat({
    id,
    initialMessages,
    api: "/api/chat",
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "msg_",
      size: 16,
    }),
    onResponse: () => {
      // Refresh the chat list when we get a response
      utils.chats.getUserChats.invalidate();
    },
    onFinish: () => {
      // Refresh the chat when finished
      utils.chats.getChatById.invalidate({ id });
    },
    onError: (error) => {
      console.error("Chat error:", error);
      if (error.message.includes("disconnect") && !isReconnecting) {
        handleReconnect();
      }
    },
  });

  // Handle client reconnection after disconnect
  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      // Fetch the latest chat state
      await utils.chats.getChatById.invalidate({ id });
      const latestChat = await chatStatus.refetch();

      if (latestChat.data) {
        // Check if the chat is still streaming
        if (latestChat.data.status === "streaming") {
          // Wait for streaming to complete
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await utils.chats.updateChatStatus.mutate({
            id,
            status: "complete",
          });
        }

        // Refresh the page to get the latest messages
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to reconnect:", error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit(e);
        adjustHeight(true);
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-8">
        <h1 className="text-lumon-terminal-text text-4xl font-bold">
          {chatTitle}
        </h1>

        <div className="w-full">
          {/* Messages display area */}
          <div className="border-lumon-terminal-text/20 bg-lumon-terminal-bg mb-4 max-h-[60vh] overflow-y-auto rounded-xl border p-4">
            {messages.length === 0 ? (
              <div className="text-lumon-terminal-text/50 flex h-32 items-center justify-center">
                Start a new conversation
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "mb-4 rounded-lg p-3",
                    message.role === "user"
                      ? "bg-lumon-terminal-text/10 text-lumon-terminal-text ml-auto"
                      : "bg-lumon-terminal-text/5 text-lumon-terminal-text mr-auto",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {message.role === "user" ? (
                      <CircleUserRound className="h-5 w-5" />
                    ) : (
                      <div className="bg-lumon-terminal-text/20 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                        AI
                      </div>
                    )}
                    <span className="text-xs font-medium">
                      {message.role === "user" ? "You" : "Assistant"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="bg-lumon-terminal-text/5 text-lumon-terminal-text mr-auto mb-4 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="bg-lumon-terminal-text/20 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                    AI
                  </div>
                  <span className="text-xs font-medium">Assistant</span>
                </div>
                <div className="mt-1 text-sm">
                  <span className="bg-lumon-terminal-text/30 inline-block h-4 w-4 animate-pulse rounded-full"></span>
                  <span
                    className="bg-lumon-terminal-text/30 ml-1 inline-block h-4 w-4 animate-pulse rounded-full"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="bg-lumon-terminal-text/30 ml-1 inline-block h-4 w-4 animate-pulse rounded-full"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-500">
                <p className="text-sm">Error: {error.message}</p>
                {error.message.includes("disconnect") && (
                  <button
                    onClick={handleReconnect}
                    className="mt-2 rounded bg-red-500 px-2 py-1 text-xs text-white"
                    disabled={isReconnecting}
                  >
                    {isReconnecting ? "Reconnecting..." : "Reconnect"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit}>
            <div className="border-lumon-terminal-text/20 bg-lumon-terminal-bg relative rounded-xl border">
              <div className="overflow-y-auto">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    handleInputChange(e);
                    adjustHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  disabled={isLoading || isReconnecting}
                  className={cn(
                    "w-full px-4 py-3",
                    "resize-none",
                    "bg-transparent",
                    "border-none",
                    "text-lumon-terminal-text text-sm",
                    "focus:outline-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "placeholder:text-lumon-terminal-text/50 placeholder:text-sm",
                    "min-h-[60px]",
                    (isLoading || isReconnecting) && "opacity-50",
                  )}
                  style={{
                    overflow: "hidden",
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="group hover:bg-lumon-terminal-text/10 flex items-center gap-1 rounded-lg p-2 transition-colors"
                    disabled={isLoading || isReconnecting}
                  >
                    <Paperclip className="text-lumon-terminal-text h-4 w-4" />
                    <span className="text-lumon-terminal-text/70 hidden text-xs transition-opacity group-hover:inline">
                      Attach
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="border-lumon-terminal-text/20 text-lumon-terminal-text/70 hover:border-lumon-terminal-text/40 hover:bg-lumon-terminal-text/10 flex items-center justify-between gap-1 rounded-lg border border-dashed px-2 py-1 text-sm transition-colors"
                    onClick={() => router.push("/lumon/kier")}
                    disabled={isLoading || isReconnecting}
                  >
                    <PlusIcon className="h-4 w-4" />
                    New Chat
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading || isReconnecting}
                    className={cn(
                      "flex items-center justify-between gap-1 rounded-lg border px-1.5 py-1.5 text-sm transition-colors",
                      input.trim() && !isLoading && !isReconnecting
                        ? "border-lumon-terminal-text bg-lumon-terminal-text text-lumon-terminal-bg"
                        : "border-lumon-terminal-text/20 text-lumon-terminal-text/70 cursor-not-allowed",
                    )}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
