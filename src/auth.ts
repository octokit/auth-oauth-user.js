import { Authentication, State, ClientType } from "./types";
import { getAuthentication } from "./get-authentication";
import { refreshToken } from "@octokit/oauth-methods";

export async function auth<TClientType extends ClientType>(
  state: State
): Promise<Authentication<TClientType>> {
  if (!state.authentication) {
    state.authentication = await getAuthentication(state);
  } else {
    const currentAuthentication = (state.authentication as unknown) as Authentication<TClientType>;

    if ("expiresAt" in currentAuthentication) {
      // @ts-expect-error TBD
      if (new Date(currentAuthentication.expiresAt) < new Date()) {
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
  }

  return state.authentication as Authentication<TClientType>;
}
