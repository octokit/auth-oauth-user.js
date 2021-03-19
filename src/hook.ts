import {
  EndpointOptions,
  EndpointDefaults,
  OctokitResponse,
  RequestInterface,
  RequestParameters,
  Route,
} from "@octokit/types";
import { OAuthAppState, GitHubAppState } from "./types";
import { auth } from "./auth";

type AnyResponse = OctokitResponse<any>;

export async function hook(
  state: OAuthAppState,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters: RequestParameters
): Promise<AnyResponse>;

export async function hook(
  state: GitHubAppState,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters: RequestParameters
): Promise<AnyResponse>;

export async function hook(
  state: OAuthAppState | GitHubAppState,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters: RequestParameters = {}
): Promise<AnyResponse> {
  // TS makes us do this ¯\_(ツ)_/¯
  const { token } =
    state.clientType === "oauth-app"
      ? await auth({ ...state, request })
      : await auth({ ...state, request });

  const endpoint = request.endpoint.merge(
    route as string,
    parameters
  ) as EndpointDefaults & { url: string };
  endpoint.headers.authorization = "token " + token;

  return request(endpoint);
}
