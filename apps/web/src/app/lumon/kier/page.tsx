"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  Figma,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
} from "lucide-react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Temporarily shrink to get the right scrollHeight
      textarea.style.height = `${minHeight}px`;

      // Calculate new height
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export default function Kier() {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        setValue("");
        adjustHeight(true);
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-8">
        <h1 className="text-lumon-terminal-text text-4xl font-bold">
          What can I help you ship?
        </h1>

        <div className="w-full">
          <div className="border-lumon-terminal-text/20 bg-lumon-terminal-bg relative rounded-xl border">
            <div className="overflow-y-auto">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask v0 a question..."
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
                >
                  <PlusIcon className="h-4 w-4" />
                  Project
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-between gap-1 rounded-lg border px-1.5 py-1.5 text-sm transition-colors",
                    value.trim()
                      ? "border-lumon-terminal-text bg-lumon-terminal-text text-lumon-terminal-bg"
                      : "border-lumon-terminal-text/20 text-lumon-terminal-text/70 hover:border-lumon-terminal-text/40 hover:bg-lumon-terminal-text/10",
                  )}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <ActionButton
              icon={<ImageIcon className="h-4 w-4" />}
              label="Clone a Screenshot"
            />
            <ActionButton
              icon={<Figma className="h-4 w-4" />}
              label="Import from Figma"
            />
            <ActionButton
              icon={<FileUp className="h-4 w-4" />}
              label="Upload a Project"
            />
            <ActionButton
              icon={<MonitorIcon className="h-4 w-4" />}
              label="Landing Page"
            />
            <ActionButton
              icon={<CircleUserRound className="h-4 w-4" />}
              label="Sign Up Form"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="border-lumon-terminal-text/20 bg-lumon-terminal-bg text-lumon-terminal-text/70 hover:bg-lumon-terminal-text/10 hover:text-lumon-terminal-text flex items-center gap-2 rounded-full border px-4 py-2 transition-colors"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
