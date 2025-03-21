import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  authenticatedProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { eq, isNull } from "drizzle-orm";

import {
  profiles,
  profilesInsertSchema,
  profilesSelectSchema,
} from "@/server/db/schemas/profiles_schema";

export const profileRouter = createTRPCRouter({
  getProfile: authenticatedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available",
        });
      }

      const profile = await ctx.db.query.profiles.findFirst({
        where: eq(profiles.id, input.id),
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }
      return profile;
    }),

  updateProfile: authenticatedProcedure
    .input(profilesSelectSchema.partial().extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available",
        });
      }

      const { id, ...updateData } = input;
      const updatedProfile = await ctx.db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.id, id))
        .returning();
      return updatedProfile[0];
    }),

  // Delete profile (soft delete)
  deleteProfile: authenticatedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available",
        });
      }

      const deletedProfile = await ctx.db
        .update(profiles)
        .set({ deletedAt: new Date() })
        .where(eq(profiles.id, input.id))
        .returning();
      return deletedProfile[0];
    }),

  listProfiles: publicProcedure
    .input(
      z
        .object({
          includeDeleted: z.boolean().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available",
        });
      }

      const whereClause = input?.includeDeleted
        ? undefined
        : isNull(profiles.deletedAt);

      return ctx.db.query.profiles.findMany({
        where: whereClause,
        orderBy: (profiles, { desc }) => [desc(profiles.createdAt)],
      });
    }),

  createInitialProfile: authenticatedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection not available",
      });
    }

    if (!ctx.user?.id || !ctx.user?.email) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User must be authenticated with email",
      });
    }

    // Check if profile already exists
    const existingProfile = await ctx.db.query.profiles.findFirst({
      where: eq(profiles.id, ctx.user.id),
    });

    if (existingProfile) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Profile already exists",
      });
    }

    // Create new profile
    const [profile] = await ctx.db
      .insert(profiles)
      .values({
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.email.split("@")[0], // Use email username as initial name
      })
      .returning();

    return profile;
  }),
});
