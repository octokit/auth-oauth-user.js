import { AuthOptions, Authentication, State, ClientType } from "./types";
import { getAuthentication } from "./get-authentication";
import {
  checkToken,
  deleteAuthorization,
  deleteToken,
  refreshToken,
  resetToken,
} from "@octokit/oauth-methods";

export async function auth<TClientType extends ClientType>(
  state: State,
  options: AuthOptions = {}
): Promise<Authentication<TClientType>> {
  if (!state.authentication) {
    state.authentication = await getAuthentication(state);
  }

  if (state.authentication.invalid) {
    throw new Error("[@octokit/auth-oauth-user] Token is invalid");
  }

  const currentAuthentication = (state.authentication as unknown) as Authentication<TClientType>;

  // (auto) refresh for user-to-server tokens
  if ("expiresAt" in currentAuthentication) {
    if (
      options.type === "refresh" ||
      // @ts-expect-error TBD
      new Date(currentAuthentication.expiresAt) < new Date()
    ) {
      const { authentication } = await refreshToken({
        clientType: "github-app",
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        // @ts-expect-error TBD
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
        "[@octokit/auth-oauth-user] OAuth Apps do not support expiring tokens"
      );
    }

    if (!currentAuthentication.hasOwnProperty("expiresAt")) {
      throw new Error("[@octokit/auth-oauth-user] Refresh token missing");
    }
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
    } catch (error) {
      // istanbul ignore else
      if (error.status === 404) {
        error.message = "[@octokit/auth-oauth-user] Token is invalid";

        // @ts-expect-error TBD
        state.authentication.invalid = true;
      }

      throw error;
    }

    return state.authentication as Authentication<TClientType>;
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
    } catch (error) {
      // istanbul ignore if
      if (error.status !== 404) throw error;
    }

    state.authentication.invalid = true;
    return state.authentication as Authentication<TClientType>;
  }

  return state.authentication as Authentication<TClientType>;
}
