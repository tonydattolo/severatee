import { PrivyWalletProvider, PrivyWalletConfig } from "@coinbase/agentkit";
import { env } from "@/env";

// Configure Wallet Provider
const config: PrivyWalletConfig = {
  appId: env.PRIVY_APP_ID,
  appSecret: env.PRIVY_API_KEY,
  chainId: "84532", // optional, defaults to 84532 (base-sepolia)
  walletId: "PRIVY_WALLET_ID", // optional, otherwise a new wallet will be created
  authorizationPrivateKey: env.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY, // optional, required if your account is using authorization keys
  authorizationKeyId: env.PRIVY_WALLET_AUTHORIZATION_KEY_ID, // optional, only required to create a new wallet if walletId is not provided
};

export const privyWalletProvider =
  await PrivyWalletProvider.configureWithWallet(config);
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
