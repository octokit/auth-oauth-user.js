import { Authentication, State } from "./types";

import { requestOAuthAccessToken } from "./request-oauth-access-token";

export async function auth(state: State): Promise<Authentication> {
  const { data } = await requestOAuthAccessToken(state);

  if (state.clientType === "oauth-app") {
    return {
      type: "token",
      tokenType: "oauth",
      clientType: "oauth-app",
      clientId: state.clientId,
      token: data.access_token,
      scopes: data.scope.split(/,\s*/).filter(Boolean),
    };
  }

  return {
    type: "token",
    tokenType: "oauth",
    clientId: state.clientId,
    token: data.access_token,
    clientType: "github-app",
  };
}
