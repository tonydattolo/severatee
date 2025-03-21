"use client";

import { useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRBAC } from "@/app/contexts/rbac-context";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  ROLES,
  type Role,
  type WorkspaceInvitation,
} from "@/server/db/schemas/workspaces_schema";
import { TableSkeleton } from "@/components/ui/table-skeleton";

type InvitationWithProfile = WorkspaceInvitation & {
  invitedByProfile: {
    name: string | null;
    email: string | null;
  } | null;
};

export default function InvitationsTable() {
  const { currentWorkspace, permissions } = useRBAC();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "owner">>("member");
  const [rowSelection, setRowSelection] = useState({});
  const utils = api.useUtils();

  const { data: invitations = [], isLoading } =
    api.workspace.getWorkspaceInvitations.useQuery(
      {
        workspaceId: currentWorkspace?.workspace.id ?? "",
      },
      {
        enabled: !!currentWorkspace?.workspace.id,
      },
    );

  const createInvitation = api.workspace.createInvitation.useMutation({
    onSuccess: (data) => {
      setEmail("");
      toast.success(`Invitation sent successfully to ${data?.email}`);
      utils.workspace.getWorkspaceInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "An error occurred");
    },
  });

  const revokeInvitation = api.workspace.revokeInvitation.useMutation({
    onSuccess: (data) => {
      toast.success(`Invitation revoked successfully for ${data.email}`);
      utils.workspace.getWorkspaceInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "An error occurred");
    },
  });

  const columns: ColumnDef<InvitationWithProfile>[] = [
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const invitation = row.original;
        return (
          invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)
        );
      },
    },
    {
      accessorKey: "invitedByProfile.name",
      header: "Invited By",
      cell: ({ row }) => {
        const invitation = row.original;
        const inviterName = invitation.invitedByProfile?.name;
        const inviterEmail = invitation.invitedByProfile?.email;

        // Show name if available, fallback to email, then to Unknown
        return inviterName || inviterEmail || "Unknown";
      },
    },
    {
      accessorKey: "createdAt",
      header: "Sent",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => new Date(row.original.expiresAt).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invitation = row.original;
        const canManageMembers = permissions.includes("MANAGE_MEMBERS");

        if (!canManageMembers) return null;

        return (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleRevokeInvitation(invitation)}
          >
            Revoke
          </Button>
        );
      },
    },
  ];

  const handleCreateInvitation = () => {
    if (!currentWorkspace?.workspace.id) return;

    createInvitation.mutate({
      workspaceId: currentWorkspace.workspace.id,
      email,
      role,
    });
  };

  const handleRevokeInvitation = (invitation: InvitationWithProfile) => {
    revokeInvitation.mutate({
      invitationId: invitation.id,
    });
  };

  const table = useReactTable({
    data: invitations,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const canInvite = permissions.includes("INVITE_MEMBERS");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Invitations</CardTitle>
        <CardDescription>
          Manage pending invitations to your workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canInvite && (
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="email">Email Address</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="w-32 space-y-2">
              <label htmlFor="role">Role</label>
              <Select
                value={role}
                onValueChange={(value: Exclude<Role, "owner">) =>
                  setRole(value)
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ROLES)
                    .filter((r) => r !== "owner")
                    .map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreateInvitation}
              disabled={!email || createInvitation.isPending}
            >
              {createInvitation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        )}

        <div className="rounded-md border">
          {isLoading ? (
            <TableSkeleton columnCount={6} />
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No pending invitations
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
