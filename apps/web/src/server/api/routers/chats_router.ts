import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, authenticatedProcedure } from "../trpc";
import { chats, chatMessages } from "../../db/schemas/chats_schemas";
import { eq, desc } from "drizzle-orm";
import { generateId } from "ai";

export const chatsRouter = createTRPCRouter({
  // Create a new chat
  createChat: authenticatedProcedure
    .input(
      z
        .object({
          title: z.string().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not found",
        });
      }

      const [newChat] = await ctx.db
        .insert(chats)
        .values({
          userId,
          title: input?.title || "New Chat",
        })
        .returning();

      return newChat;
    }),

  // Get a chat by ID with its messages
  getChatById: authenticatedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not found",
        });
      }

      const chat = await ctx.db.query.chats.findFirst({
        where: eq(chats.id, input.id),
        with: {
          messages: {
            orderBy: [chatMessages.createdAt],
          },
        },
      });

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      if (chat.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this chat",
        });
      }

      return chat;
    }),

  // Get all chats for the current user
  getUserChats: authenticatedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const userChats = await ctx.db.query.chats.findMany({
      where: eq(chats.userId, userId),
      orderBy: [desc(chats.updatedAt)],
    });

    return userChats;
  }),

  // Update chat status
  updateChatStatus: authenticatedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["complete", "streaming"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const [updatedChat] = await ctx.db
        .update(chats)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(chats.id, input.id))
        .returning();

      if (!updatedChat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      if (updatedChat.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this chat",
        });
      }

      return updatedChat;
    }),

  // Save messages to a chat
  saveMessages: authenticatedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
        messages: z.array(
          z.object({
            id: z.string(),
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
            createdAt: z.date().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify chat ownership
      const chat = await ctx.db.query.chats.findFirst({
        where: eq(chats.id, input.chatId),
      });

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      if (chat.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this chat",
        });
      }

      // Delete existing messages for this chat
      await ctx.db
        .delete(chatMessages)
        .where(eq(chatMessages.chatId, input.chatId));

      // Insert new messages
      if (input.messages.length > 0) {
        await ctx.db.insert(chatMessages).values(
          input.messages.map((message) => ({
            id: message.id,
            chatId: input.chatId,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt || new Date(),
          })),
        );
      }

      // Update chat's updatedAt timestamp
      await ctx.db
        .update(chats)
        .set({
          updatedAt: new Date(),
          status: "complete",
        })
        .where(eq(chats.id, input.chatId));

      return { success: true };
    }),

  // Add a single message to a chat
  addMessage: authenticatedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
        message: z.object({
          id: z.string(),
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify chat ownership
      const chat = await ctx.db.query.chats.findFirst({
        where: eq(chats.id, input.chatId),
      });

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      if (chat.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this chat",
        });
      }

      // Insert the new message
      await ctx.db.insert(chatMessages).values({
        id: input.message.id,
        chatId: input.chatId,
        role: input.message.role,
        content: input.message.content,
        createdAt: new Date(),
      });

      // Update chat's updatedAt timestamp
      await ctx.db
        .update(chats)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(chats.id, input.chatId));

      return { success: true };
    }),
});
