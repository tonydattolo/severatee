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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function SubmitTaskPage({
  params,
}: {
  params: { taskId: string };
}) {
  const { taskId } = params;
  const router = useRouter();

  const [formData, setFormData] = useState({
    answer: "",
    progress: 100, // Set to 100 when submitting
  });

  // Fetch task details
  const { data: task, isLoading: loadingTask } = api.lumon.getUserTask.useQuery(
    { taskId },
    { enabled: !!taskId },
  );

  // Submit task mutation
  const submitTaskMutation = api.lumon.submitTask.useMutation({
    onSuccess: (data) => {
      toast.success("Task submitted successfully", {
        description: "Your work has been securely stored in Nillion.",
      });
      router.push("/lumon/tasks");
    },
    onError: (error) => {
      toast.error("Error submitting task", {
        description: error.message,
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.answer.trim()) {
      toast.error("Validation Error", {
        description: "Please provide an answer for the task.",
      });
      return;
    }

    submitTaskMutation.mutate({
      taskId,
      answer: formData.answer,
      progress: formData.progress,
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
        <h1 className="text-3xl font-bold">Submit Task</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{task.name}</CardTitle>
          <CardDescription>
            Please complete the task according to the instructions below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="mb-2 font-semibold">Instructions:</h3>
            <p className="text-sm whitespace-pre-line text-gray-700">
              {task.instructions}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Label htmlFor="answer" className="mb-2 block">
                Answer <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="answer"
                name="answer"
                placeholder="Enter your answer..."
                value={formData.answer}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    answer: e.target.value,
                  }))
                }
                rows={5}
                className="mb-1"
              />
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-4"
                onClick={() => router.push("/lumon/tasks")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitTaskMutation.isPending}>
                {submitTaskMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Answer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
