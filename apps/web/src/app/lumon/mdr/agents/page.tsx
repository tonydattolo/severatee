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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, User, Wallet, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LumonAdminPage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Agent form state
  const [agentForm, setAgentForm] = useState({
    name: "",
    description: "",
  });

  // Fetch agents
  const {
    data: agents,
    isLoading: loadingAgents,
    refetch: refetchAgents,
  } = api.lumon.getAgents.useQuery();

  // Create agent mutation
  const createAgentMutation = api.lumon.createAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent created", {
        description: "The new Lumon agent has been created successfully.",
      });
      setAgentForm({
        name: "",
        description: "",
      });
      setIsDialogOpen(false);
      refetchAgents();
    },
    onError: (error) => {
      toast.error("Error creating agent", {
        description: error.message,
      });
    },
  });

  // Handle agent form input changes
  const handleAgentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setAgentForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle agent form submission
  const handleAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!agentForm.name.trim()) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    // Create agent
    createAgentMutation.mutate({
      name: agentForm.name,
      description: agentForm.description,
      status: "active",
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-input/30 border-green-700 text-green-700"
          >
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge
            variant="outline"
            className="bg-input/30 border-gray-700 text-gray-700"
          >
            Inactive
          </Badge>
        );
      case "maintenance":
        return (
          <Badge
            variant="outline"
            className="bg-input/30 border-yellow-700 text-yellow-700"
          >
            Maintenance
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Update the assignTaskForm state
  const [assignTaskForm, setAssignTaskForm] = useState({
    taskTypeId: "",
    agentId: "", // Changed from profileId to agentId
    dueDate: undefined as Date | undefined,
  });

  // Fetch agents for assignment
  const { data: agentsForAssignment, isLoading: loadingAgentsForAssignment } =
    api.lumon.getAgents.useQuery();

  // // Update the form submission
  // const handleAssignTaskSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();

  //   // Validate form
  //   if (!assignTaskForm.taskTypeId || !assignTaskForm.agentId) {
  //     toast.error("Validation Error", {
  //       description: "Please select a task type and an agent.",
  //     });
  //     return;
  //   }

  //   // Assign task
  //   assignTaskMutation.mutate({
  //     taskTypeId: assignTaskForm.taskTypeId,
  //     agentId: assignTaskForm.agentId, // Changed from profileId to agentId
  //     dueDate: assignTaskForm.dueDate,
  //   });
  // };

  // Update the agent selection dropdown
  <div className="mb-4">
    <Label htmlFor="agentId" className="mb-2 block">
      Agent <span className="text-red-500">*</span>
    </Label>
    <Select
      value={assignTaskForm.agentId}
      onValueChange={(value) =>
        setAssignTaskForm((prev) => ({
          ...prev,
          agentId: value,
        }))
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select an agent" />
      </SelectTrigger>
      <SelectContent>
        {agentsForAssignment?.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>;

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lumon Agents</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Add a new AI agent to perform Lumon tasks.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAgentSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Agent name"
                    value={agentForm.name}
                    onChange={handleAgentInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Agent description and capabilities..."
                    value={agentForm.description}
                    onChange={handleAgentInputChange}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createAgentMutation.isPending}>
                  {createAgentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Agent
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loadingAgents ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{agent.name}</CardTitle>
                  <StatusBadge status={agent.status} />
                </div>
                <CardDescription>
                  <div className="mt-2 flex items-center text-sm">
                    <Wallet className="mr-1 h-4 w-4" />
                    <span className="truncate font-mono text-xs">
                      {agent.walletAddress}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {agent.description || "No description provided."}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/lumon/mdr/agents/${agent.id}`)}
                >
                  View Details
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/lumon/mdr/agents/${agent.id}/tasks`)
                  }
                >
                  View Tasks
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No Agents Found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create your first Lumon agent to start assigning tasks.
          </p>
          <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </div>
      )}
    </div>
  );
}
