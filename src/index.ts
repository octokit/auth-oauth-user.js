import { getUserAgent } from "universal-user-agent";
import { request } from "@octokit/request";

import { VERSION } from "./version";
import { auth } from "./auth";
import { hook } from "./hook";
import { StrategyOptions, StrategyInterface, State, ClientType } from "./types";

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
    options,
    {
      // Only Client IDs belonging to GitHub Apps have a "lv1." prefix
      // To be more future proof, we only check for the existense of the "."
      clientType: /\./.test(options.clientId)
        ? "github-app"
        : ("oauth-app" as ClientType),
    }
  );

  return Object.assign(auth.bind(null, state), {
    hook: hook.bind(null, state),
  });
};

createOAuthUserAuth.VERSION = VERSION;
