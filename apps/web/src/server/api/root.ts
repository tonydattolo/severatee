import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { profileRouter } from "@/server/api/routers/profile_router";
import { workspaceRouter } from "@/server/api/routers/workspace_router";
import { chatsRouter } from "./routers/chats_router";
import { walletsRouter } from "./routers/wallets_router";
import { lumonRouter } from "./routers/lumon_router";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  profile: profileRouter,
  workspace: workspaceRouter,
  chats: chatsRouter,
  wallets: walletsRouter,
  lumon: lumonRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
