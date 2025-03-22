import { PrivyClient } from "@privy-io/server-auth";
import { env } from "@/env";

export const privyClient = new PrivyClient(
  env.PRIVY_APP_ID,
  env.PRIVY_API_KEY,
  {
    // apiURL: "https://api.privy.io",
    walletApi: {
      authorizationPrivateKey: env.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY,
      // apiURL: "https://wallet.privy.io",
    },
  },
);
// example usage
// const wallet = await privyClient.walletApi.create({
//   chainType: "ethereum",
//   authorizationKeyIds: [env.PRIVY_WALLET_AUTHORIZATION_KEY_ID],
// });
