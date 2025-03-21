"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { type Profile } from "@/server/db/schemas/profiles_schema";
import {
  type Workspace,
  type Role,
} from "@/server/db/schemas/workspaces_schema";
import { api } from "@/trpc/react";

// Define permissions
export const PERMISSIONS = {
  VIEW_WORKSPACE: "VIEW_WORKSPACE",
  EDIT_WORKSPACE: "EDIT_WORKSPACE",
  DELETE_WORKSPACE: "DELETE_WORKSPACE",
  INVITE_MEMBERS: "INVITE_MEMBERS",
  MANAGE_MEMBERS: "MANAGE_MEMBERS",
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.VIEW_WORKSPACE,
    PERMISSIONS.EDIT_WORKSPACE,
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.MANAGE_MEMBERS,
  ],
  member: [PERMISSIONS.VIEW_WORKSPACE],
};

interface WorkspaceMembership {
  workspace: Workspace;
  role: Role;
  permissions: Permission[];
}

interface RBACContextType {
  profile: Profile | null;
  workspaceMemberships: WorkspaceMembership[];
  currentWorkspace: WorkspaceMembership | null;
  permissions: Permission[];
  setCurrentWorkspace: (workspace: Workspace) => void;
  updateProfileContext: (profile: Profile) => void;
  updateWorkspaceContext: (workspace: Workspace) => void;
  addWorkspaceMembership: (membership: WorkspaceMembership) => void;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

const STORAGE_KEY = "lastWorkspaceId";

export function RBACProvider({
  children,
  initialProfile,
  initialWorkspaces = [],
}: {
  children: React.ReactNode;
  initialProfile: Profile;
  initialWorkspaces?: WorkspaceMembership[];
}) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [workspaceMemberships, setWorkspaceMemberships] =
    useState<WorkspaceMembership[]>(initialWorkspaces);
  const [currentWorkspace, setCurrentWorkspace] =
    useState<WorkspaceMembership | null>(null);

  // Query to fetch workspaces if no initial data
  const { data: fetchedWorkspaceMemberships } =
    api.workspace.getUserWorkspaces.useQuery(undefined, {
      enabled: initialWorkspaces.length === 0,
    });

  useEffect(() => {
    if (fetchedWorkspaceMemberships) {
      setWorkspaceMemberships(fetchedWorkspaceMemberships);
    }
  }, [fetchedWorkspaceMemberships]);

  // Load last selected workspace from localStorage
  useEffect(() => {
    const lastWorkspaceId = localStorage.getItem(STORAGE_KEY);
    if (lastWorkspaceId && workspaceMemberships.length > 0) {
      const membership = workspaceMemberships.find(
        (m) => m.workspace.id === lastWorkspaceId,
      );
      if (membership) {
        handleWorkspaceChange(membership);
      } else {
        // Fallback to first workspace if saved one not found
        handleWorkspaceChange(workspaceMemberships[0]);
      }
    } else if (workspaceMemberships.length > 0) {
      // If no saved workspace, default to first
      handleWorkspaceChange(workspaceMemberships[0]);
    }
  }, [workspaceMemberships]);

  const handleWorkspaceChange = (membership: WorkspaceMembership) => {
    setCurrentWorkspace(membership);
    localStorage.setItem(STORAGE_KEY, membership.workspace.id);
  };

  const permissions = currentWorkspace
    ? ROLE_PERMISSIONS[currentWorkspace.role]
    : [];

  return (
    <RBACContext.Provider
      value={{
        profile,
        workspaceMemberships,
        currentWorkspace,
        permissions,
        setCurrentWorkspace: (workspace) => {
          const membership = workspaceMemberships.find(
            (m) => m.workspace.id === workspace.id,
          );
          if (membership) {
            handleWorkspaceChange(membership);
          }
        },
        updateProfileContext: (profile) => {
          setProfile(profile);
        },
        updateWorkspaceContext: (workspace) => {
          setWorkspaceMemberships((prev) =>
            prev.map((membership) =>
              membership.workspace.id === workspace.id
                ? { ...membership, workspace }
                : membership,
            ),
          );

          if (currentWorkspace?.workspace.id === workspace.id) {
            setCurrentWorkspace((prev) =>
              prev ? { ...prev, workspace } : null,
            );
          }
        },
        addWorkspaceMembership: (membership) => {
          setWorkspaceMemberships((prev) => [...prev, membership]);
          handleWorkspaceChange(membership);
        },
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error("useRBAC must be used within a RBACProvider");
  }
  return context;
}
