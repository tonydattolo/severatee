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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useRBAC } from "@/app/contexts/rbac-context";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ROLES, type Role } from "@/server/db/schemas/workspaces_schema";
import { TableSkeleton } from "@/components/ui/table-skeleton";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
};

export default function MembersTable() {
  const { currentWorkspace, permissions } = useRBAC();
  const [rowSelection, setRowSelection] = useState({});

  // Query workspace members
  const { data: members = [], isLoading } =
    api.workspace.getWorkspaceMembers.useQuery(
      {
        workspaceId: currentWorkspace?.workspace.id ?? "",
      },
      {
        enabled: !!currentWorkspace?.workspace.id,
      },
    );

  // Mutations
  const updateRole = api.workspace.updateMemberRole.useMutation({
    onSuccess: () => {
      refetchMembers();
    },
  });

  const removeMember = api.workspace.removeMember.useMutation({
    onSuccess: () => {
      refetchMembers();
    },
  });

  // Add this helper function to check owner count
  const getOwnerCount = () => {
    return members.filter((member) => member.role === "owner").length;
  };

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const member = row.original;
        const canManageMembers = permissions.includes("MANAGE_MEMBERS");
        const isLastOwner = member.role === "owner" && getOwnerCount() === 1;

        if (!canManageMembers) {
          return <span>{member.role}</span>;
        }

        return (
          <Select
            value={member.role}
            onValueChange={(newRole: Role) => handleRoleChange(member, newRole)}
            disabled={isLastOwner}
          >
            <SelectTrigger
              className="w-32"
              title={
                isLastOwner ? "Cannot change the last owner's role" : undefined
              }
            >
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ROLES).map((role) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original;
        const canManageMembers = permissions.includes("MANAGE_MEMBERS");
        const isLastOwner = member.role === "owner" && getOwnerCount() === 1;

        if (!canManageMembers) return null;

        return (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleRemoveMember(member)}
            disabled={isLastOwner}
            title={isLastOwner ? "Cannot remove the last owner" : undefined}
          >
            Remove
          </Button>
        );
      },
    },
  ];

  const handleRoleChange = async (member: Member, newRole: Role) => {
    try {
      await updateRole.mutateAsync({
        memberId: member.id,
        role: newRole,
      });
      toast.success(`Updated ${member.name}'s role to ${newRole}`);
    } catch (error) {
      toast.error("Failed to update member role");
    }
  };

  const handleRemoveMember = async (member: Member) => {
    try {
      await removeMember.mutateAsync({
        memberId: member.id,
      });
      toast.success(`Removed ${member.name} from the workspace`);
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const table = useReactTable({
    data: members,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workspace Members</CardTitle>
          <CardDescription>
            Manage members and their roles in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <TableSkeleton columnCount={4} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Members</CardTitle>
        <CardDescription>
          Manage members and their roles in this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
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
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
