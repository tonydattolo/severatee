import { PrivyWalletProvider, PrivyWalletConfig } from "@coinbase/agentkit";
import { env } from "@/env";
import {
  AgentKit,
  cdpApiActionProvider,
  erc721ActionProvider,
  pythActionProvider,
  walletActionProvider,
  CdpWalletProvider,
} from "@coinbase/agentkit";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";

// Configure Wallet Provider
const config: PrivyWalletConfig = {
  appId: env.PRIVY_APP_ID,
  appSecret: env.PRIVY_API_KEY,
  chainId: "84532", // optional, defaults to 84532 (base-sepolia)
  walletId: env.PRIVY_LUMON_MANAGER_WALLET_ID, // optional, otherwise a new wallet will be created
  authorizationPrivateKey: env.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY, // optional, required if your account is using authorization keys
  authorizationKeyId: env.PRIVY_WALLET_AUTHORIZATION_KEY_ID, // optional, only required to create a new wallet if walletId is not provided
};

export const privyWalletProvider =
  await PrivyWalletProvider.configureWithWallet(config);

export async function initializeAgentkitTools() {
  try {
    // const walletProvider = await CdpWalletProvider.configureWithWallet({
    //   apiKeyName: process.env.CDP_API_KEY_NAME,
    //   apiKeyPrivateKey: env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    //   networkId: "base-sepolia",
    // });

    // const agentKit = await AgentKit.from({
    //   walletProvider,
    //   actionProviders: [
    //     cdpApiActionProvider({
    //       apiKeyName: env.CDP_API_KEY_NAME,
    //       apiKeyPrivateKey: env.CDP_API_KEY_PRIVATE_KEY,
    //     }),
    //     erc721ActionProvider(),
    //     pythActionProvider(),
    //     walletActionProvider(),
    //   ],
    // });
    const agentKit = await AgentKit.from({
      // cdpApiKeyName: env.CDP_API_KEY_NAME,
      // cdpApiKeyPrivateKey: env.CDP_API_KEY_PRIVATE_KEY,
      walletProvider: privyWalletProvider,
      actionProviders: [
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
        }),
        erc721ActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
      ],
    });

    const tools = getVercelAITools(agentKit);
    return tools;
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}
// export const privyWalletProvider = new PrivyWalletProvider({
//   appId: env.PRIVY_APP_ID,
//   appSecret: env.PRIVY_API_KEY,
//   chainId: "84532", // optional, defaults to 84532 (base-sepolia)
//   walletId: env.PRIVY_LUMON_MANAGER_WALLET_ID, // optional, otherwise a new wallet will be created
//   authorizationPrivateKey: env.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY, // optional, required if your account is using authorization keys
//   authorizationKeyId: env.PRIVY_WALLET_AUTHORIZATION_KEY_ID, // optional, only required to create a new wallet if walletId is not provided
// } satisfies PrivyWalletConfig);

// const walletData = await walletProvider.exportWallet();

// // walletData will be in the following format:
// {
//     walletId: string;
//     authorizationKey: string | undefined;
//     networkId: string | undefined;
// }

// By default, AgentKit supports the following basic wallet operations:

//     get_wallet_details - Get details about the Wallet, like the address
//     transfer - Transfer assets between addresses
//     get_balance - Get the balance of an asset

// You can add additional actions or action providers upon agent instantiation.
