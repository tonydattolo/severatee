import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { authenticatedProcedure, createTRPCRouter } from "@/server/api/trpc";
import { eq, and, isNull, not, sql } from "drizzle-orm";
import {
  workspaces,
  workspaceMembers,
  workspacesInsertSchema,
  ROLES,
  type Role,
  workspaceInvitations,
  type WorkspaceInvitation,
} from "@/server/db/schemas/workspaces_schema";
import { profiles } from "@/server/db/schemas/profiles_schema";
import { ROLE_PERMISSIONS } from "@/app/contexts/rbac-context";

export const workspaceRouter = createTRPCRouter({
  createWorkspace: authenticatedProcedure
    .input(
      workspacesInsertSchema.omit({
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        id: true,
        role: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a workspace",
        });
      }

      // Start a transaction
      return await ctx.db.transaction(async (tx) => {
        // Create the workspace
        const [workspace] = await tx
          .insert(workspaces)
          .values({
            ...input,
            createdBy: ctx.user.id,
          })
          .returning();

        // Add the creator as an owner
        await tx.insert(workspaceMembers).values({
          workspaceId: workspace.id,
          userId: ctx.user.id,
          role: ROLES.OWNER,
        });

        return {
          workspace,
          role: ROLES.OWNER,
          permissions: ROLE_PERMISSIONS[ROLES.OWNER],
        };
      });
    }),

  getWorkspaces: authenticatedProcedure.query(async ({ ctx }) => {
    const workspaces = await ctx.db.query.workspaces.findMany({
      with: {
        members: true,
      },
    });
    return workspaces;
  }),

  getUserWorkspaces: authenticatedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to fetch workspaces",
      });
    }

    const allUserWorkspaces = await ctx.db
      .select({
        workspace: workspaces,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, ctx.user.id),
          isNull(workspaceMembers.deletedAt),
          isNull(workspaces.deletedAt),
        ),
      );

    return allUserWorkspaces.map(({ workspace, role }) => ({
      ...workspace,
      role, // Include the user's role in the workspace object
    }));
  }),

  getWorkspaceMembers: authenticatedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const members = await ctx.db
        .select({
          id: workspaceMembers.id,
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          name: profiles.name,
          email: profiles.email,
        })
        .from(workspaceMembers)
        .innerJoin(profiles, eq(profiles.id, workspaceMembers.userId))
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            isNull(workspaceMembers.deletedAt),
          ),
        );

      return members;
    }),

  updateMemberRole: authenticatedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["owner", "admin", "member"] as const),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the member being updated
      const memberToUpdate = await ctx.db.query.workspaceMembers.findFirst({
        where: eq(workspaceMembers.id, input.memberId),
      });

      if (!memberToUpdate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // If changing from owner role, check if they're the last one
      if (memberToUpdate.role === "owner" && input.role !== "owner") {
        const ownerCount = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, memberToUpdate.workspaceId),
              eq(workspaceMembers.role, "owner"),
              isNull(workspaceMembers.deletedAt),
            ),
          )
          .then((result) => result[0]?.count ?? 0);

        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot change role of the last owner",
          });
        }
      }

      // Proceed with update
      const [updatedMember] = await ctx.db
        .update(workspaceMembers)
        .set({
          role: input.role,
          updatedAt: new Date(),
        })
        .where(eq(workspaceMembers.id, input.memberId))
        .returning();

      return updatedMember;
    }),

  removeMember: authenticatedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get the member to be removed
      const memberToRemove = await ctx.db.query.workspaceMembers.findFirst({
        where: eq(workspaceMembers.id, input.memberId),
      });

      if (!memberToRemove) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // If the member is an owner, check if they're the last one
      if (memberToRemove.role === "owner") {
        const ownerCount = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, memberToRemove.workspaceId),
              eq(workspaceMembers.role, "owner"),
              isNull(workspaceMembers.deletedAt),
            ),
          )
          .then((result) => result[0]?.count ?? 0);

        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot remove the last owner of the workspace",
          });
        }
      }

      // Proceed with removal
      const [removedMember] = await ctx.db
        .update(workspaceMembers)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(workspaceMembers.id, input.memberId))
        .returning();

      return removedMember;
    }),

  updateWorkspace: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to update workspace
      const membership = await ctx.db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, input.id),
          eq(workspaceMembers.userId, ctx.user.id),
          isNull(workspaceMembers.deletedAt),
        ),
      });

      if (!membership || !["owner", "admin"].includes(membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this workspace",
        });
      }

      // Check if slug is unique if provided
      if (input.slug) {
        const existingWorkspace = await ctx.db.query.workspaces.findFirst({
          where: and(
            eq(workspaces.slug, input.slug),
            not(eq(workspaces.id, input.id)),
            isNull(workspaces.deletedAt),
          ),
        });

        if (existingWorkspace) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A workspace with this slug already exists",
          });
        }
      }

      // Update workspace
      const [updatedWorkspace] = await ctx.db
        .update(workspaces)
        .set({
          name: input.name,
          slug: input.slug,
          description: input.description,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, input.id))
        .returning();

      return updatedWorkspace;
    }),

  getWorkspaceInvitations: authenticatedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invitations = await ctx.db
        .select({
          id: workspaceInvitations.id,
          email: workspaceInvitations.email,
          role: workspaceInvitations.role,
          status: workspaceInvitations.status,
          expiresAt: workspaceInvitations.expiresAt,
          createdAt: workspaceInvitations.createdAt,
          invitedBy: workspaceInvitations.invitedBy,
          invitedByProfile: {
            name: profiles.name,
            email: profiles.email,
          },
        })
        .from(workspaceInvitations)
        .leftJoin(profiles, eq(profiles.id, workspaceInvitations.invitedBy))
        .where(
          and(
            eq(workspaceInvitations.workspaceId, input.workspaceId),
            eq(workspaceInvitations.status, "pending"),
          ),
        );

      return invitations;
    }),

  createInvitation: authenticatedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string().email(),
        role: z.enum(["admin", "member"] as const),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create invitations",
        });
      }

      // Check if invitation already exists
      const existingInvitation = await ctx.db
        .select()
        .from(workspaceInvitations)
        .where(
          and(
            eq(workspaceInvitations.workspaceId, input.workspaceId),
            eq(workspaceInvitations.email, input.email),
            eq(workspaceInvitations.status, "pending"),
          ),
        )
        .limit(1);

      if (existingInvitation.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An invitation for this email already exists",
        });
      }

      // Check if user is already a member
      const existingMember = await ctx.db
        .select()
        .from(workspaceMembers)
        .innerJoin(profiles, eq(profiles.id, workspaceMembers.userId))
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(profiles.email, input.email),
            isNull(workspaceMembers.deletedAt),
          ),
        )
        .limit(1);

      if (existingMember.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This user is already a member of the workspace",
        });
      }

      // Create invitation
      const [invitation] = await ctx.db
        .insert(workspaceInvitations)
        .values({
          workspaceId: input.workspaceId,
          email: input.email,
          role: input.role,
          invitedBy: ctx.user.id,
          status: "pending",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        })
        .returning();

      return invitation;
    }),

  revokeInvitation: authenticatedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Delete the invitation instead of updating its status
      const [deletedInvitation] = await ctx.db
        .delete(workspaceInvitations)
        .where(eq(workspaceInvitations.id, input.invitationId))
        .returning();

      if (!deletedInvitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      return deletedInvitation;
    }),

  getUserInvitations: authenticatedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view invitations",
      });
    }

    const profile = await ctx.db.query.profiles.findFirst({
      where: eq(profiles.id, ctx.user.id),
    });

    if (!profile?.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User profile not found",
      });
    }

    return ctx.db
      .select({
        invitation: workspaceInvitations,
        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
      })
      .from(workspaceInvitations)
      .innerJoin(
        workspaces,
        eq(workspaces.id, workspaceInvitations.workspaceId),
      )
      .where(
        and(
          eq(workspaceInvitations.email, profile.email),
          eq(workspaceInvitations.status, "pending"),
          isNull(workspaces.deletedAt),
        ),
      );
  }),

  acceptInvitation: authenticatedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to accept invitations",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        // Get the invitation and workspace details in one query
        const [invitationWithWorkspace] = await tx
          .select({
            invitation: workspaceInvitations,
            workspace: workspaces,
          })
          .from(workspaceInvitations)
          .innerJoin(
            workspaces,
            eq(workspaces.id, workspaceInvitations.workspaceId),
          )
          .where(eq(workspaceInvitations.id, input.invitationId))
          .limit(1);

        if (!invitationWithWorkspace) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found",
          });
        }

        const { invitation, workspace } = invitationWithWorkspace;

        // Create workspace member
        const [member] = await tx
          .insert(workspaceMembers)
          .values({
            workspaceId: invitation.workspaceId,
            userId: ctx.user.id,
            role: invitation.role,
          })
          .returning();

        // Delete the invitation
        await tx
          .delete(workspaceInvitations)
          .where(eq(workspaceInvitations.id, input.invitationId));

        return {
          workspace,
          role: member.role,
          permissions: ROLE_PERMISSIONS[member.role],
        };
      });
    }),
});
