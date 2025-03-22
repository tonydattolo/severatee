"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Wallet,
  Activity,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function AgentDetailPage({
  params,
}: {
  params: { agentId: string };
}) {
  // const { agentId } = React.use(params);
  const { agentId } = useParams<{ agentId: string }>();
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Agent form state for editing
  const [agentForm, setAgentForm] = useState({
    name: "",
    description: "",
    status: "",
  });

  // Fetch agent details
  const {
    data: agent,
    isLoading: loadingAgent,
    refetch: refetchAgent,
  } = api.lumon.getAgent.useQuery(
    { agentId },
    {
      enabled: !!agentId,
      onSuccess: (data) => {
        if (data) {
          setAgentForm({
            name: data.name,
            description: data.description || "",
            status: data.status,
          });
        }
      },
    },
  );

  // Fetch agent tasks summary
  const { data: tasksSummary, isLoading: loadingTasksSummary } =
    api.lumon.getAgentTasksSummary.useQuery(
      { agentId },
      { enabled: !!agentId },
    );

  // Update agent mutation
  const updateAgentMutation = api.lumon.updateAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent updated", {
        description: "The agent has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      refetchAgent();
    },
    onError: (error) => {
      toast.error("Error updating agent", {
        description: error.message,
      });
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = api.lumon.deleteAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent deleted", {
        description: "The agent has been deleted successfully.",
      });
      router.push("/lumon/agents");
    },
    onError: (error) => {
      toast.error("Error deleting agent", {
        description: error.message,
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setAgentForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!agentForm.name.trim()) {
      toast.error("Validation Error", {
        description: "Agent name is required.",
      });
      return;
    }

    // Update agent
    updateAgentMutation.mutate({
      id: agentId,
      name: agentForm.name,
      description: agentForm.description,
      status: agentForm.status as "active" | "inactive" | "maintenance",
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    deleteAgentMutation.mutate({ agentId });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Inactive
          </Badge>
        );
      case "maintenance":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Maintenance
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            onClick={() => router.push("/lumon/agents")}
            variant="outline"
            size="sm"
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{agent.name}</h1>
          <div className="ml-4">
            <StatusBadge status={agent.status} />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Agent Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
            <CardDescription>
              Details about this Lumon agent and its capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-1 font-medium">Wallet Address</h3>
              <div className="bg-input/30 flex items-center rounded-md p-3">
                <Wallet className="mr-2 h-5 w-5 text-gray-500" />
                <code className="text-sm">{agent.walletAddress}</code>
              </div>
            </div>

            <div>
              <h3 className="mb-1 font-medium">Description</h3>
              <p className="bg-input/30 rounded-md p-3 text-gray-700">
                {agent.description || "No description provided."}
              </p>
            </div>

            <div>
              <h3 className="mb-1 font-medium">Status</h3>
              <div className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-gray-500" />
                <span>
                  {agent.status === "active"
                    ? "Active and ready for tasks"
                    : agent.status === "inactive"
                      ? "Inactive - not accepting new tasks"
                      : "Under maintenance"}
                </span>
              </div>
            </div>

            <div>
              <h3 className="mb-1 font-medium">Created</h3>
              <div className="flex items-center">
                <span>
                  {new Date(agent.createdAt).toLocaleDateString()} at{" "}
                  {new Date(agent.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => router.push(`/lumon/agents/${agentId}/tasks`)}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              View All Tasks
            </Button>
          </CardFooter>
        </Card>

        {/* Tasks Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks Summary</CardTitle>
            <CardDescription>
              Overview of tasks assigned to this agent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTasksSummary ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : tasksSummary ? (
              <div className="space-y-4">
                <div className="bg-input/30 flex items-center justify-between rounded-md p-3 text-blue-700">
                  <div className="flex items-center">
                    <ClipboardList className="mr-2 h-5 w-5" />
                    <span>Total Tasks</span>
                  </div>
                  <span className="text-xl font-bold">
                    {tasksSummary.total}
                  </span>
                </div>

                <div className="bg-input/30 flex items-center justify-between rounded-md p-3 text-yellow-700">
                  <div className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    <span>In Progress</span>
                  </div>
                  <span className="text-xl font-bold">
                    {tasksSummary.inProgress}
                  </span>
                </div>

                <div className="bg-input/30 flex items-center justify-between rounded-md p-3 text-green-700">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span>Completed</span>
                  </div>
                  <span className="text-xl font-bold">
                    {tasksSummary.completed}
                  </span>
                </div>

                <div className="bg-input/30 flex items-center justify-between rounded-md p-3 text-red-700">
                  <div className="flex items-center">
                    <XCircle className="mr-2 h-5 w-5" />
                    <span>Rejected</span>
                  </div>
                  <span className="text-xl font-bold">
                    {tasksSummary.rejected}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No task data available.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Edit Agent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update the information for this Lumon agent.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={agentForm.name}
                  onChange={handleInputChange}
                  placeholder="Enter agent name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={agentForm.description}
                  onChange={handleInputChange}
                  placeholder="Enter agent description"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={agentForm.status}
                  onChange={handleInputChange}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateAgentMutation.isPending}>
                {updateAgentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agent? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4 font-medium text-gray-700">{agent.name}</p>
            <div className="rounded-md bg-red-50 p-4 text-red-800">
              <p className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Warning: Deleting this agent will remove all associated data and
                task assignments.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteAgentMutation.isPending}
            >
              {deleteAgentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
