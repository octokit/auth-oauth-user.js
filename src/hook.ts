import {
  EndpointOptions,
  OctokitResponse,
  RequestInterface,
  RequestParameters,
  Route,
} from "@octokit/types";
import { State } from "./types";

type AnyResponse = OctokitResponse<any>;

export async function hook(
  state: State,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters: RequestParameters = {}
): Promise<AnyResponse> {
  console.log("Implement auth.hook()", state);

  return typeof route === "string"
    ? request(route, parameters)
    : request(route);
}
