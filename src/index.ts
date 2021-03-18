import { getUserAgent } from "universal-user-agent";
import { request } from "@octokit/request";

import { VERSION } from "./version";
import { auth } from "./auth";
import { hook } from "./hook";
import { StrategyOptions, State, ClientType, AuthInterface } from "./types";

export function createOAuthUserAuth<
  TClientType extends ClientType = "oauth-app"
>(options: StrategyOptions<TClientType>): AuthInterface<TClientType> {
  const {
    clientId,
    clientSecret,
    clientType = "oauth-app",
    request: localRequest,
    ...strategyOptions
  } = options;

  const state: State = Object.assign({
    clientType,
    clientId,
    clientSecret,
    strategyOptions,
    request:
      localRequest ||
      request.defaults({
        headers: {
          "user-agent": `octokit-auth-oauth-app.js/${VERSION} ${getUserAgent()}`,
        },
      }),
  });

  // @ts-expect-error the extra code is not worth it just to make TS happpy
  return Object.assign(auth.bind(null, state), {
    hook: hook.bind(null, state),
  });
}

createOAuthUserAuth.VERSION = VERSION;
