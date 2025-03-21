import * as profilesSchema from "./profiles_schema";
import * as workspacesSchema from "./workspaces_schema";
import * as oauthTokensSchema from "./oauth_tokens_schema";

export const schema = {
  ...profilesSchema,
  ...workspacesSchema,
  ...oauthTokensSchema,
};
