"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRBAC } from "@/app/contexts/rbac-context";
import { api } from "@/trpc/react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function GeneralSettings() {
  const { currentWorkspace, permissions, updateWorkspaceContext } = useRBAC();
  const canEdit = permissions.includes("EDIT_WORKSPACE");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentWorkspace?.workspace.name ?? "",
      slug: currentWorkspace?.workspace.slug ?? "",
      description: currentWorkspace?.workspace.description ?? "",
    },
  });

  const updateWorkspace = api.workspace.updateWorkspace.useMutation({
    onSuccess: (data) => {
      toast.success("Workspace settings updated successfully");
      reset({
        name: data.name,
        slug: data.slug ?? "",
        description: data.description ?? "",
      });
      updateWorkspaceContext(data);
    },
    onError: (error) => {
      toast.error(error.message ?? "An error occurred");
    },
  });

  const onSubmit = (data: FormData) => {
    if (!currentWorkspace?.workspace.id) return;

    updateWorkspace.mutate({
      id: currentWorkspace.workspace.id,
      ...data,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Manage general workspace settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              {...register("name")}
              disabled={!canEdit}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Workspace Slug
              <span className="text-muted-foreground ml-1 text-sm">
                (used in URLs)
              </span>
            </Label>
            <Input
              id="slug"
              {...register("slug")}
              disabled={!canEdit}
              className={errors.slug ? "border-destructive" : ""}
            />
            {errors.slug && (
              <p className="text-destructive text-sm">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register("description")}
              disabled={!canEdit}
            />
          </div>

          {canEdit && (
            <Button
              type="submit"
              disabled={!isDirty || updateWorkspace.isPending}
            >
              {updateWorkspace.isPending ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
