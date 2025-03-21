import * as profilesSchema from "./profiles_schema";
import * as workspacesSchema from "./workspaces_schema";
import * as oauthTokensSchema from "./oauth_tokens_schema";
// import * as walletsSchema from "./wallets";
import * as chatsSchema from "./chats_schemas";

export const schema = {
  ...profilesSchema,
  ...workspacesSchema,
  ...oauthTokensSchema,
  ...chatsSchema,
  // ...walletsSchema,
};
