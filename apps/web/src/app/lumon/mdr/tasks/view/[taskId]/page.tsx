"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Wallet,
  Brain,
} from "lucide-react";
import { toast } from "sonner";

export default function ViewTaskPage({
  params,
}: {
  params: { taskId: string };
}) {
  const { taskId } = params;
  const router = useRouter();
  const [isThinking, setIsThinking] = useState(false);

  // Fetch task details
  const { data: task, isLoading: loadingTask } = api.lumon.getAllTasks.useQuery(
    { taskId },
    { enabled: !!taskId },
  );

  const mysteriousWorkMutation =
    api.lumon.mysteriousAndImportantWork.useMutation({
      onSuccess: (data) => {
        toast.success("Response received", {
          description: data.answer,
        });
        setIsThinking(false);
      },
      onError: (error) => {
        toast.error("Error", {
          description: error.message,
        });
        setIsThinking(false);
      },
    });

  const handleMysteriousWork = async () => {
    setIsThinking(true);
    mysteriousWorkMutation.mutate({
      taskId,
      message: "What insights can you share about this task?",
    });
  };

  if (loadingTask) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-3xl font-bold">Task Not Found</h1>
        <p>The requested task could not be found.</p>
        <Button
          className="mt-4"
          onClick={() => router.push("/lumon/mdr/tasks")}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  const currentTask = task.find((t) => t.id === taskId);
  if (!currentTask) return null;

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-center">
        <Button
          onClick={() => router.push("/lumon/mdr/tasks")}
          variant="outline"
          size="sm"
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Task Details</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{currentTask.name}</CardTitle>
              <CardDescription className="mt-1">
                Created on{" "}
                {new Date(currentTask.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={
                currentTask.status === "completed"
                  ? "bg-lumon-light-blue text-green-700"
                  : "bg-lumon-light-blue text-blue-700"
              }
            >
              {currentTask.status.charAt(0).toUpperCase() +
                currentTask.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold tracking-wide text-gray-600 uppercase">
              TASK DETAILS
            </h3>
            <p className="text-gray-700">{currentTask.instructions}</p>
          </div>

          <Separator className="my-6" />

          {currentTask.agent && (
            <>
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold tracking-wide text-gray-600 uppercase">
                  ASSIGNED AGENT
                </h3>
                <div className="bg-input/30 rounded-md p-4">
                  <div className="flex items-center">
                    <div className="bg-input/30 text-input mr-4 flex h-10 w-10 items-center justify-center rounded-full">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{currentTask.agent.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Wallet className="mr-1 h-4 w-4" />
                        <span className="truncate font-mono text-xs">
                          {currentTask.agent.walletAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-6" />
            </>
          )}

          <div className="flex justify-between">
            <Button
              onClick={handleMysteriousWork}
              disabled={isThinking}
              className="w-full"
            >
              {isThinking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              Perform Mysterious and Important Work
            </Button>
          </div>

          {currentTask.answer && (
            <div className="mt-6">
              <h3 className="mb-2 text-lg font-semibold tracking-wide text-gray-600 uppercase">
                TASK RESPONSE
              </h3>
              <div className="bg-input/30 rounded-md p-4">
                <p className="whitespace-pre-wrap">{currentTask.answer}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
