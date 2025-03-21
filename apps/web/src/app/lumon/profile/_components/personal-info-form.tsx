"use client";

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
import {
  type Profile,
  profilesSelectSchema,
} from "@/server/db/schemas/profiles_schema";

// Update FormInputs to remove email
type FormInputs = Pick<Profile, "name" | "role">;

export default function PersonalInfoForm() {
  const router = useRouter();
  const { profile, updateProfileContext } = useRBAC();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(
      profilesSelectSchema.pick({
        name: true,
        role: true,
      }),
    ),
    defaultValues: {
      name: profile?.name || "",
      role: profile?.role || "",
    },
  });

  const updateProfile = api.profile.updateProfile.useMutation({
    onSuccess: (data) => {
      updateProfileContext(data);
      toast.success("Profile updated successfully");
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormInputs) => {
    updateProfile.mutate({
      id: profile.id,
      ...data,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" {...register("role")} />
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Read-only fields */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (cannot be changed)</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Created</Label>
              <Input
                value={
                  profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : ""
                }
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Updated</Label>
              <Input
                value={
                  profile?.updatedAt
                    ? new Date(profile.updatedAt).toLocaleDateString()
                    : ""
                }
                disabled
                className="bg-muted"
              />
            </div>
            {profile?.username && (
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={profile.username} disabled className="bg-muted" />
              </div>
            )}
          </div>

          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Updating..." : "Update Personal Info"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
