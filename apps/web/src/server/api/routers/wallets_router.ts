import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, authenticatedProcedure } from "@/server/api/trpc";
import { chats, chatMessages } from "@/server/db/schemas/chats_schemas";
import { eq, desc } from "drizzle-orm";
import { createIdGenerator, generateId } from "ai";
import { privyClient } from "@/app/lumon/kier/_utils/privyClient";
import { env } from "@/env";

export const walletsRouter = createTRPCRouter({
  createPrivyWallet: authenticatedProcedure.mutation(async ({ ctx }) => {
    try {
      const { id, address, chainType } = await privyClient.walletApi.create({
        chainType: "ethereum",
        // authorizationKeyIds: [env.PRIVY_WALLET_AUTHORIZATION_KEY_ID],
      });
      console.log(
        "wallet in createPrivyWallet procedure:",
        id,
        address,
        chainType,
      );
      return { id, address, chainType };
    } catch (error) {
      console.error("Error in createPrivyWallet procedure:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create Privy wallet",
        cause: error,
      });
    }
  }),
});
