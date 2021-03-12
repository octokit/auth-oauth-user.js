import { getUserAgent } from "universal-user-agent";
import { request } from "@octokit/request";

import { VERSION } from "./version";
import { auth } from "./auth";
import { hook } from "./hook";
import { StrategyOptions, StrategyInterface, State } from "./types";

export const createOAuthUserAuth: StrategyInterface = function createOAuthUserAuth(
  options: StrategyOptions
) {
  const state: State = Object.assign(
    {
      request: request.defaults({
        headers: {
          "user-agent": `octokit-auth-oauth-app.js/${VERSION} ${getUserAgent()}`,
        },
      }),
    },
    options
  );

  return Object.assign(auth.bind(null, state), {
    hook: hook.bind(null, state),
  });
};

createOAuthUserAuth.VERSION = VERSION;
