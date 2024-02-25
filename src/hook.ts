import type {
  EndpointOptions,
  EndpointDefaults,
  OctokitResponse,
  RequestInterface,
  RequestParameters,
  Route,
} from "@octokit/types";

import type { OAuthAppState, GitHubAppState } from "./types.js";
import { auth } from "./auth.js";
import { requiresBasicAuth } from "./requires-basic-auth.js";

type AnyResponse = OctokitResponse<any>;

export async function hook(
  state: OAuthAppState,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters: RequestParameters,
): Promise<AnyResponse>;

export async function hook(
  state: GitHubAppState,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters: RequestParameters,
): Promise<AnyResponse>;

export async function hook(
  state: OAuthAppState | GitHubAppState,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters: RequestParameters = {},
): Promise<AnyResponse> {
  const endpoint = request.endpoint.merge(
    route as string,
    parameters,
  ) as EndpointDefaults & { url: string };

  // Do not intercept OAuth Web/Device flow request
  if (
    /\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url as string)
  ) {
    return request(endpoint);
  }

  if (requiresBasicAuth(endpoint.url)) {
    const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
    endpoint.headers.authorization = `basic ${credentials}`;
    return request(endpoint);
  }

  // TS makes us do this ¯\_(ツ)_/¯
  const { token } =
    state.clientType === "oauth-app"
      ? await auth({ ...state, request })
      : await auth({ ...state, request });

  endpoint.headers.authorization = "token " + token;

  return request(endpoint);
}
