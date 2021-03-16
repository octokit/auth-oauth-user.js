import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";

import { Authentication, State, ClientType } from "./types";
import { requestOAuthAccessToken } from "./request-oauth-access-token";

function toTimestamp(apiTimeInMs: number, expirationInSeconds: number) {
  return new Date(apiTimeInMs + expirationInSeconds * 1000).toISOString();
}

export async function auth<TClientType extends ClientType>(
  state: State
): Promise<Authentication<TClientType>> {
  // handle code exchange form OAuth Web Flow
  if ("code" in state.strategyOptions) {
    const { data, headers } = await requestOAuthAccessToken(
      state.request,
      state.clientId,
      state.clientSecret,
      state.strategyOptions
    );

    if (state.clientType === "oauth-app") {
      return {
        type: "token",
        tokenType: "oauth",
        clientType: "oauth-app",
        clientId: state.clientId,
        token: data.access_token,
        scopes: data.scope.split(/,\s*/).filter(Boolean),
      } as Authentication<TClientType>;
    }

    if ("refresh_token" in data) {
      const apiTimeInMs = new Date(headers.date as string).getTime();

      return {
        type: "token",
        tokenType: "oauth",
        clientType: "github-app",
        clientId: state.clientId,
        token: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: toTimestamp(apiTimeInMs, data.expires_in),
        refreshTokenExpiresAt: toTimestamp(
          apiTimeInMs,
          data.refresh_token_expires_in
        ),
      } as Authentication<TClientType>;
    }

    return {
      type: "token",
      tokenType: "oauth",
      clientType: "github-app",
      clientId: state.clientId,
      token: data.access_token,
    } as Authentication<TClientType>;
  }

  // handle OAuth device flow
  if ("onVerification" in state.strategyOptions) {
    // TODO: shorten the code below while keeping typescript happy
    const deviceAuth =
      state.clientType === "oauth-app"
        ? createOAuthDeviceAuth<"oauth-app">({
            clientType: "oauth-app",
            clientId: state.clientId,
            onVerification: state.strategyOptions.onVerification,
            scopes: state.strategyOptions.scopes,
            request: state.request,
          })
        : createOAuthDeviceAuth<"github-app">({
            clientType: "github-app",
            clientId: state.clientId,
            onVerification: state.strategyOptions.onVerification,
            request: state.request,
          });

    const authentication = await deviceAuth({
      type: "oauth",
    });
    return authentication as Authentication<TClientType>;
  }

  // use existing authentication
  if ("token" in state.strategyOptions) {
    return {
      type: "token",
      tokenType: "oauth",
      clientId: state.clientId,
      clientType: state.clientType,
      ...state.strategyOptions,
    } as Authentication<TClientType>;
  }

  throw new Error("[@octokit/auth-oauth-user] Invalid strategy options");
}
