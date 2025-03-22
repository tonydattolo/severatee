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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function LumonTasksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("assigned");

  // Fetch task types
  const { data: taskTypes, isLoading: loadingTaskTypes } =
    api.lumon.getTaskTypes.useQuery();

  // Fetch user tasks based on status
  const {
    data: tasks,
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = api.lumon.getUserTasks.useQuery({
    profileId: "your-profile-id", // Replace with actual profile ID or get from context
    status: activeTab === "all" ? undefined : (activeTab as any),
  });

  // Start task mutation
  const startTaskMutation = api.lumon.updateTaskStatus.useMutation({
    onSuccess: () => {
      refetchTasks();
      toast.success("Task started", {
        description: "You have started working on this task.",
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle start task
  const handleStartTask = (taskId: string) => {
    startTaskMutation.mutate({ taskId, status: "in_progress" });
  };

  // Handle submit task (navigate to submission form)
  const handleSubmitTask = (taskId: string) => {
    router.push(`/lumon/tasks/submit/${taskId}`);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "assigned":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Assigned
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Completed
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Lumon Tasks</h1>

      <Tabs
        defaultValue="assigned"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loadingTasks ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">
                        {task.taskType.name}
                      </CardTitle>
                      <StatusBadge status={task.status} />
                    </div>
                    <CardDescription>
                      {task.dueDate && (
                        <div className="mt-2 flex items-center text-sm">
                          <Clock className="mr-1 h-4 w-4" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {task.taskType.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 bg-gray-50">
                    {task.status === "assigned" && (
                      <Button
                        variant="outline"
                        onClick={() => handleStartTask(task.id)}
                        disabled={startTaskMutation.isPending}
                      >
                        {startTaskMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Start Task
                      </Button>
                    )}
                    {task.status === "in_progress" && (
                      <Button onClick={() => handleSubmitTask(task.id)}>
                        Submit Work
                      </Button>
                    )}
                    {task.status === "completed" && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(`/lumon/tasks/view/${task.id}`)
                        }
                      >
                        View Submission
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-gray-500">No tasks found in this category.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
