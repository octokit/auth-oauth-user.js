import { Authentication, State } from "./types";

import { requestOAuthAccessToken } from "./request-oauth-access-token";

function toTimestamp(apiTimeInMs: number, expirationInSeconds: number) {
  return new Date(apiTimeInMs + expirationInSeconds * 1000).toISOString();
}

export async function auth(state: State): Promise<Authentication> {
  const { data, headers } = await requestOAuthAccessToken(state);

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

  if ("refresh_token" in data) {
    const apiTimeInMs = new Date(headers.date as string).getTime();

    return {
      type: "token",
      tokenType: "oauth",
      clientId: state.clientId,
      token: data.access_token,
      clientType: "github-app",
      refreshToken: data.refresh_token,
      expiresAt: toTimestamp(apiTimeInMs, data.expires_in),
      refreshTokenExpiresAt: toTimestamp(
        apiTimeInMs,
        data.refresh_token_expires_in
      ),
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
