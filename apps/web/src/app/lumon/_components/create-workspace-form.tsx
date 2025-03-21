"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/app/contexts/rbac-context";
import { ROLE_PERMISSIONS } from "@/app/contexts/rbac-context";
import {
  type NewWorkspace,
  workspacesInsertSchema,
} from "@/server/db/schemas/workspaces_schema";
import { LogOut } from "lucide-react";
import { signOut } from "../_actions/sign-out";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FormInputs = Pick<NewWorkspace, "name" | "slug" | "description">;

export default function CreateWorkspaceForm() {
  const router = useRouter();
  const {
    profile,
    setCurrentWorkspace,
    workspaceMemberships,
    addWorkspaceMembership,
  } = useRBAC();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(
      workspacesInsertSchema.pick({
        name: true,
        slug: true,
        description: true,
      }) as any,
    ),
  });

  const [activeTab, setActiveTab] = useState("create");

  // Query for pending invitations
  const { data: invitations = [] } =
    api.workspace.getUserInvitations.useQuery();

  const createWorkspace = api.workspace.createWorkspace.useMutation({
    onSuccess: (workspace) => {
      toast.success("Workspace created successfully");

      // Make sure workspace.workspace exists before setting it
      if (workspace?.workspace) {
        // Create a proper WorkspaceMembership object
        const newWorkspaceMembership = {
          workspace: workspace.workspace,
          role: workspace.role || "owner", // Default to owner if not provided
          permissions: ROLE_PERMISSIONS[workspace.role || "owner"],
        };

        // Add the new membership to RBAC context
        addWorkspaceMembership(newWorkspaceMembership);
      }

      // After creating the workspace, we'll refresh the page
      // The layout will load the new workspace data and redirect to dashboard
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const acceptInvitation = api.workspace.acceptInvitation.useMutation({
    onSuccess: (data) => {
      // Create a new workspace membership object
      const newWorkspaceMembership = {
        workspace: data.workspace,
        role: data.role,
        permissions: data.permissions,
      };

      // Add the new membership to RBAC context
      addWorkspaceMembership(newWorkspaceMembership);

      toast.success("Invitation accepted successfully");

      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: FormInputs) => {
    if (!profile) return;

    createWorkspace.mutate({
      name: data.name,
      slug: data.slug || null,
      description: data.description || null,
    } as any);
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      router.push("/");
    } else {
      toast.error(result.error || "Failed to sign out. Please try again.");
    }
  };

  const handleAcceptInvitation = (invitationId: string) => {
    acceptInvitation.mutate({ invitationId });
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Workspace</TabsTrigger>
              <TabsTrigger
                value="invitations"
                disabled={invitations.length === 0}
              >
                Invitations{" "}
                {invitations.length > 0 && `(${invitations.length})`}
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="create">
              <div className="mb-4 space-y-2">
                <h2 className="text-2xl font-bold">Create Your Workspace</h2>
                <p className="text-muted-foreground text-sm">
                  Get started by creating your first workspace
                </p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Workspace"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="slug">
                    Workspace URL
                    <span className="text-muted-foreground text-sm">
                      {" "}
                      (cannot be changed later)
                    </span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-sm">
                      workspace/
                    </span>
                    <Input
                      id="slug"
                      placeholder="my-workspace"
                      {...register("slug")}
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-destructive text-sm">
                      {errors.slug.message}
                    </p>
                  )}
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description{" "}
                    <small className="text-muted-foreground text-sm">
                      (optional)
                    </small>
                  </Label>
                  <Input
                    id="description"
                    placeholder="What's this workspace for?"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createWorkspace.isPending}
                >
                  {createWorkspace.isPending
                    ? "Creating..."
                    : "Create Workspace"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="invitations">
              <div className="mb-4 space-y-2">
                <h2 className="text-2xl font-bold">Pending Invitations</h2>
                <p className="text-muted-foreground text-sm">
                  Join existing workspaces you've been invited to
                </p>
              </div>
              <div className="space-y-4">
                {invitations.length === 0 ? (
                  <p className="text-muted-foreground text-center text-sm">
                    No pending invitations
                  </p>
                ) : (
                  invitations.map(({ invitation, workspace }) => (
                    <Card key={invitation.id}>
                      <CardContent className="pt-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold">
                            {workspace.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Role: {invitation.role}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          className="w-full"
                          disabled={acceptInvitation.isPending}
                        >
                          {acceptInvitation.isPending
                            ? "Accepting..."
                            : "Accept Invitation"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </CardContent>

          <div className="flex items-center justify-center p-6 pt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
