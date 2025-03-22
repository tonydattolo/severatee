"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Lock,
  Calendar,
  FileText,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export default function ViewTaskPage({
  params,
}: {
  params: { taskId: string };
}) {
  const { taskId } = params;
  const router = useRouter();

  // Fetch task details
  const { data: task, isLoading: loadingTask } = api.lumon.getUserTask.useQuery(
    { taskId },
    { enabled: !!taskId },
  );

  // Fetch task submission from Nillion
  const { data: submission, isLoading: loadingSubmission } =
    api.lumon.getTaskSubmission.useQuery(
      { nillionRecordId: task?.nillionRecordId || "" },
      { enabled: !!task?.nillionRecordId },
    );

  if (loadingTask || loadingSubmission) {
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
        <p>
          The requested task could not be found or you don't have permission to
          access it.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/lumon/tasks")}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center">
        <Button
          onClick={() => router.push("/lumon/tasks")}
          variant="outline"
          size="sm"
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Task Submission</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{task.taskType.name}</CardTitle>
              <CardDescription className="mt-1">
                Completed on{" "}
                {new Date(task.completedAt || "").toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold tracking-wide text-gray-600 uppercase">
              TASK DETAILS
            </h3>
            <p className="text-gray-700">{task.taskType.description}</p>
          </div>

          <Separator className="my-6" />

          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold tracking-wide text-gray-600 uppercase">
              AGENT INFORMATION
            </h3>
            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex items-center">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{task.agent.name}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Wallet className="mr-1 h-4 w-4" />
                    <span className="truncate font-mono text-xs">
                      {task.agent.walletAddress}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold tracking-wide text-gray-600 uppercase">
              SUBMISSION
            </h3>
            <div className="rounded-md bg-blue-50 p-4 text-blue-800">
              <div className="flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                <p>
                  This submission is securely stored in Nillion SecretVault with
                  privacy-preserving encryption.
                </p>
              </div>
            </div>
          </div>

          {submission ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 font-medium">Numbers</h3>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="font-mono">{submission.data.numbers}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Observations</h3>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="whitespace-pre-line">
                    {submission.data.observations}
                  </p>
                </div>
              </div>

              {submission.data.additionalNotes && (
                <div>
                  <h3 className="mb-2 font-medium">Additional Notes</h3>
                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="whitespace-pre-line">
                      {submission.data.additionalNotes}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="mr-1 h-4 w-4" />
                <span>
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-yellow-50 p-4 text-yellow-800">
              <p>The submission data could not be retrieved from Nillion.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
