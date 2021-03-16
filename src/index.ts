import { getUserAgent } from "universal-user-agent";
import { request } from "@octokit/request";
import {
  RequestInterface,
  Route,
  EndpointOptions,
  RequestParameters,
} from "@octokit/types";

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

  return Object.assign(() => auth<TClientType>(state), {
    hook: (
      request: RequestInterface,
      route: Route | EndpointOptions,
      parameters: RequestParameters
    ) => hook(state, request, route, parameters),
  });
}

createOAuthUserAuth.VERSION = VERSION;
