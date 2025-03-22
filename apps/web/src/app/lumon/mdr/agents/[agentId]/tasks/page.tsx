"use client";

import { useState } from "react";
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
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function AgentTasksPage({
  params,
}: {
  params: { agentId: string };
}) {
  const { agentId } = params;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch agent details
  const { data: agent, isLoading: loadingAgent } = api.lumon.getAgent.useQuery(
    { agentId },
    { enabled: !!agentId },
  );

  // Fetch agent tasks based on status
  const {
    data: tasks,
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = api.lumon.getAgentTasks.useQuery(
    {
      agentId,
      status: activeTab === "all" ? undefined : (activeTab as any),
    },
    { enabled: !!agentId },
  );

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
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

  if (loadingAgent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-3xl font-bold">Agent Not Found</h1>
        <p>
          The requested agent could not be found or you don't have permission to
          access it.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/lumon/agents")}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Agents
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center">
        <Button
          onClick={() => router.push("/lumon/agents")}
          variant="outline"
          size="sm"
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{agent.name}'s Tasks</h1>
          <p className="text-gray-500">
            <span className="font-mono text-xs">{agent.walletAddress}</span>
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <TabsList className="mb-8">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
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
                      <CardTitle>{task.taskType.name}</CardTitle>
                      <StatusBadge status={task.status} />
                    </div>
                    <CardDescription>
                      {task.dueDate && (
                        <div className="mt-1 flex items-center text-sm">
                          <Clock className="mr-1 h-4 w-4" />
                          <span>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {task.taskType.description?.substring(0, 100) ||
                        "No description provided."}
                      {task.taskType.description &&
                        task.taskType.description.length > 100 &&
                        "..."}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 bg-gray-50">
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
