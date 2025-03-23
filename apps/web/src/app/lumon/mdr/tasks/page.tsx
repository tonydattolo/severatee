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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Loader2,
  Plus,
  Calendar,
  User,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export default function TasksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Task form state
  const [taskForm, setTaskForm] = useState({
    name: "",
    instructions: "",
    agentId: "",
    dueDate: undefined as Date | undefined,
    status: "assigned" as const,
    progress: 0,
  });

  // Fetch tasks with filters
  const {
    data: tasks,
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = api.lumon.getAllTasks.useQuery(
    activeTab === "all" ? undefined : { status: activeTab as any },
  );

  // Fetch agents for the form
  const { data: agents } = api.lumon.getAgents.useQuery();

  // Create task mutation
  const createTaskMutation = api.lumon.createTask.useMutation({
    onSuccess: () => {
      toast.success("Task created", {
        description: "The new task has been created successfully.",
      });
      setTaskForm({
        name: "",
        instructions: "",
        agentId: "",
        dueDate: undefined,
        status: "assigned",
        progress: 0,
      });
      setIsCreateDialogOpen(false);
      refetchTasks();
    },
    onError: (error) => {
      toast.error("Error creating task", {
        description: error.message,
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (name: string, value: any) => {
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskForm.name || !taskForm.instructions || !taskForm.agentId) {
      toast.error("Validation Error", {
        description: "Please fill in all fields.",
      });
      return;
    }

    createTaskMutation.mutate(taskForm);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "assigned":
        return (
          <Badge
            variant="outline"
            className="bg-lumon-light-blue text-lumon-blue"
          >
            Assigned
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="bg-lumon-light-blue text-lumon-blue"
          >
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-lumon-light-blue text-lumon-blue"
          >
            Completed
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-lumon-light-blue text-lumon-blue"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lumon Tasks</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Assign a new task to a Lumon agent.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Task Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={taskForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter task name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="instructions">
                    Instructions <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="instructions"
                    value={taskForm.instructions}
                    onChange={(e) =>
                      handleInputChange("instructions", e.target.value)
                    }
                    placeholder="Enter task instructions"
                    rows={4}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="agentId">
                    Agent <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={taskForm.agentId}
                    onValueChange={(value) =>
                      handleInputChange("agentId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents?.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <DatePicker
                    date={taskForm.dueDate}
                    setDate={(date) => handleInputChange("dueDate", date)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
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
                      <CardTitle>{task.name}</CardTitle>
                      <StatusBadge status={task.status} />
                    </div>
                    <CardDescription>
                      {task.agent && (
                        <div className="mt-2 flex items-center text-sm">
                          <User className="mr-1 h-4 w-4" />
                          <span>{task.agent.name}</span>
                        </div>
                      )}
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
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="mt-1" />
                    </div>
                    <p className="text-sm text-gray-600">
                      {task.instructions?.substring(0, 100) ||
                        "No instructions provided."}
                      {task.instructions &&
                        task.instructions.length > 100 &&
                        "..."}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/lumon/mdr/tasks/view/${task.id}`)
                      }
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No Tasks Found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create your first task to get started.
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
