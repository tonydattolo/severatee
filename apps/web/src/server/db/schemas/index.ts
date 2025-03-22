import * as profilesSchema from "./profiles_schema";
import * as workspacesSchema from "./workspaces_schema";
import * as oauthTokensSchema from "./oauth_tokens_schema";
// import * as walletsSchema from "./wallets";
import * as chatsSchema from "./chats_schemas";
import * as lumonSchemas from "./lumon_schemas";

export const schema = {
  ...profilesSchema,
  ...workspacesSchema,
  ...oauthTokensSchema,
  ...chatsSchema,
  ...lumonSchemas,
  // ...walletsSchema,
};
