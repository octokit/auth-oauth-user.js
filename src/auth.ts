import type {
  OAuthAppAuthOptions,
  GitHubAppAuthOptions,
  OAuthAppAuthentication,
  GitHubAppAuthentication,
  GitHubAppAuthenticationWithExpiration,
  OAuthAppState,
  GitHubAppState,
} from "./types.js";
import { getAuthentication } from "./get-authentication.js";
import {
  checkToken,
  deleteAuthorization,
  deleteToken,
  refreshToken,
  resetToken,
} from "@octokit/oauth-methods";

export async function auth(
  state: OAuthAppState,
  options?: OAuthAppAuthOptions,
): Promise<OAuthAppAuthentication>;

export async function auth(
  state: GitHubAppState,
  options?: GitHubAppAuthOptions,
): Promise<GitHubAppAuthentication | GitHubAppAuthenticationWithExpiration>;

export async function auth(
  state: OAuthAppState | GitHubAppState,
  options: OAuthAppAuthOptions | GitHubAppAuthOptions = {},
): Promise<
  | OAuthAppAuthentication
  | GitHubAppAuthentication
  | GitHubAppAuthenticationWithExpiration
> {
  if (!state.authentication) {
    // This is what TS makes us do ¯\_(ツ)_/¯
    state.authentication =
      state.clientType === "oauth-app"
        ? await getAuthentication(state)
        : await getAuthentication(state);
  }

  if (state.authentication.invalid) {
    throw new Error("[@octokit/auth-oauth-user] Token is invalid");
  }

  const currentAuthentication = state.authentication;

  // (auto) refresh for user-to-server tokens
  if ("expiresAt" in currentAuthentication) {
    if (
      options.type === "refresh" ||
      new Date(currentAuthentication.expiresAt) < new Date()
    ) {
      const { authentication } = await refreshToken({
        clientType: "github-app",
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        refreshToken: currentAuthentication.refreshToken,
        request: state.request,
      });
      state.authentication = {
        tokenType: "oauth",
        type: "token",
        ...authentication,
      };
    }
  }

  // throw error for invalid refresh call
  if (options.type === "refresh") {
    if (state.clientType === "oauth-app") {
      throw new Error(
        "[@octokit/auth-oauth-user] OAuth Apps do not support expiring tokens",
      );
    }

    if (!currentAuthentication.hasOwnProperty("expiresAt")) {
      throw new Error("[@octokit/auth-oauth-user] Refresh token missing");
    }

    await state.onTokenCreated?.(state.authentication, {
      type: options.type,
    });
  }

  // check or reset token
  if (options.type === "check" || options.type === "reset") {
    const method = options.type === "check" ? checkToken : resetToken;
    try {
      const { authentication } = await method({
        // @ts-expect-error making TS happy would require unnecessary code so no
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: state.authentication.token,
        request: state.request,
      });

      state.authentication = {
        tokenType: "oauth",
        type: "token",
        // @ts-expect-error TBD
        ...authentication,
      };

      if (options.type === "reset") {
        await state.onTokenCreated?.(state.authentication, {
          type: options.type,
        });
      }

      return state.authentication as
        | OAuthAppAuthentication
        | GitHubAppAuthentication
        | GitHubAppAuthenticationWithExpiration;
    } catch (error: any) {
      /* v8 ignore next 5 */
      if (error.status === 404) {
        error.message = "[@octokit/auth-oauth-user] Token is invalid";

        // @ts-expect-error TBD
        state.authentication.invalid = true;
      }

      throw error;
    }
  }

  // invalidate
  if (options.type === "delete" || options.type === "deleteAuthorization") {
    const method =
      options.type === "delete" ? deleteToken : deleteAuthorization;
    try {
      await method({
        // @ts-expect-error making TS happy would require unnecessary code so no
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: state.authentication.token,
        request: state.request,
      });
    } catch (error: any) {
      /* v8 ignore next */
      if (error.status !== 404) throw error;
    }

    state.authentication.invalid = true;
    return state.authentication;
  }

  return state.authentication;
}
