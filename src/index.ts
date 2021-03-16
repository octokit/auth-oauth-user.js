import { getUserAgent } from "universal-user-agent";
import { request } from "@octokit/request";

import { VERSION } from "./version";
import { auth } from "./auth";
import { hook } from "./hook";
import { StrategyOptions, StrategyInterface, State } from "./types";

export const createOAuthUserAuth: StrategyInterface = function createOAuthUserAuth(
  options: StrategyOptions
) {
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

  return Object.assign(auth.bind(null, state), {
    hook: hook.bind(null, state),
  });
};

createOAuthUserAuth.VERSION = VERSION;
