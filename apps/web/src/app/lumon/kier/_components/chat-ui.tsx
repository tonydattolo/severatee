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
  AlertCircle,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { createIdGenerator } from "ai";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChatWithMessages } from "@/server/db/schemas/chats_schemas";

interface ChatUIProps {
  id?: string | undefined;
  initialMessages?: Message[];
  chat?: ChatWithMessages;
}

export default function ChatUI({ id, initialMessages, chat }: ChatUIProps) {
  const router = useRouter();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const utils = api.useUtils();

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    // maxHeight: 200,
  });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    append,
    setMessages,
    reload,
  } = useChat({
    id,
    initialMessages,
    sendExtraMessageFields: true,
    api: "/api/chat",
    streamProtocol: "text",
    generateId: createIdGenerator({
      prefix: "msg",
      separator: "_",
      size: 16,
    }),
    onResponse: (response) => {
      // Clear any previous errors when we get a successful response
      setErrorMessage(null);
      console.log("Got response:", response);
    },
    onError: (error) => {
      // Set a user-friendly error message
      setErrorMessage("Failed to get a response. Please try again.");
      console.error("Chat error:", error);
    },
    onFinish: () => {
      console.log("Chat finished");
      // utils.chats.getChatById.invalidate({ id });
    },
  });

  useEffect(() => {
    if (initialMessages?.length === 1) {
      setMessages(initialMessages);
      reload();
    }
  }, []);

  // useEffect(() => {
  //   console.log("messages", messages);
  // }, [messages]);

  // Check if the chat is currently loading (status is submitted or streaming)
  const isLoading = status === "submitted" || status === "streaming";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        console.log("Submitting message:", input);
        try {
          handleSubmit(e);
          adjustHeight(true);
        } catch (error) {
          console.error("Error submitting message:", error);
          setErrorMessage("Failed to send your message. Please try again.");
        }
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-8">
        <div className="flex items-center gap-2">
          <h1 className="text-lumon-terminal-text text-4xl font-bold">
            {chat?.title ?? "New Chat"}
          </h1>
          <div
            className={cn("rounded-full px-2 py-1 text-xs", statusPill(status))}
          >
            {status}
          </div>
        </div>

        <div className="w-full">
          {/* Error message display */}
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Messages display area */}
          <div className="border-lumon-terminal-text/20 bg-lumon-terminal-bg mb-4 max-h-[60vh] overflow-y-auto rounded-xl border p-4">
            {messages.length === 0 ? (
              <div className="text-lumon-terminal-text/50 flex h-32 items-center justify-center">
                {chat?.title ?? "New Chat"}
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
          </div>

          {/* Input area */}
          <form
            onSubmit={(e) => {
              try {
                handleSubmit(e);
                adjustHeight(true);
              } catch (error) {
                console.error("Error submitting form:", error);
                setErrorMessage(
                  "Failed to send your message. Please try again.",
                );
              }
            }}
          >
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

// Helper function to get the appropriate CSS class for a status pill
function statusPill(status: string) {
  switch (status) {
    case "submitted":
      return "bg-blue-500";
    case "streaming":
      return "bg-green-500";
    case "ready":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}
