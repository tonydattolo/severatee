// app/layout.tsx
import * as React from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/server";
import { api } from "@/trpc/server";

import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { toast } from "sonner";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import LoadingScreen from "@/components/common/loading-screen";
import db from "@/server/db/db";
import { eq, isNull, and } from "drizzle-orm";
import { profiles } from "@/server/db/schemas/profiles_schema";
import {
  workspaces,
  workspaceMembers,
  type Workspace,
} from "@/server/db/schemas/workspaces_schema";
import { ROLE_PERMISSIONS } from "@/app/contexts/rbac-context";
import { RBACProvider } from "@/app/contexts/rbac-context";
import CreateWorkspaceForm from "./_components/create-workspace-form";

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthenticatedLayout children={children} />
    </Suspense>
  );
}

async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Fetch profile and workspace memberships
  let [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id));

  if (!profile) {
    // Edge case, postgres trigger to create profile didn't run, we create manually for authenticated user
    try {
      const manualProfileInit = await api.profile.createInitialProfile();
      if (!manualProfileInit) {
        throw new Error("Failed to create profile");
      }
    } catch (error) {
      console.error("No profile found: ", error);
      // redirect("/auth/login");
    }
  }

  // Fetch all workspaces the user is a member of, including their role
  const workspaceMembershipsData = await db
    .select({
      workspace: workspaces,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(
        eq(workspaceMembers.userId, user.id),
        isNull(workspaceMembers.deletedAt),
        isNull(workspaces.deletedAt),
      ),
    );

  // Transform the memberships into the WorkspaceAccess format
  const workspaceMemberships = workspaceMembershipsData.map(
    ({ workspace, role }) => ({
      workspace,
      role,
      permissions: ROLE_PERMISSIONS[role] ?? [],
    }),
  );

  // If user has no workspaces, show the create workspace form
  if (workspaceMemberships.length === 0) {
    return (
      <RBACProvider
        initialProfile={profile}
        initialWorkspaces={workspaceMemberships}
      >
        <CreateWorkspaceForm />
      </RBACProvider>
    );
  }

  return (
    <RBACProvider
      initialProfile={profile}
      initialWorkspaces={workspaceMemberships}
    >
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RBACProvider>
  );
}
