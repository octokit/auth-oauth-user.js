import {
  EndpointOptions,
  EndpointDefaults,
  OctokitResponse,
  RequestInterface,
  RequestParameters,
  Route,
} from "@octokit/types";
import { State } from "./types";
import { auth } from "./auth";

type AnyResponse = OctokitResponse<any>;

export async function hook(
  state: State,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters: RequestParameters = {}
): Promise<AnyResponse> {
  const { token } = await auth({
    ...state,
    request,
  });

  const endpoint = request.endpoint.merge(
    route as string,
    parameters
  ) as EndpointDefaults & { url: string };
  endpoint.headers.authorization = "token " + token;

  return request(endpoint);
}
