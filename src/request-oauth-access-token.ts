import { RequestError } from "@octokit/request-error";

import { OctokitResponse } from "@octokit/types";
import { State } from "./types";

type OAuthResponseDataForOAuthApps = {
  access_token: string;
  token_type: "bearer";
  scope: string;
};
type OAuthResponseDataForGitHubAppsWithoutExpiration = {
  access_token: string;
  token_type: "bearer";
  scope: "";
};

type OAuthResponseDataForGitHubAppsWithExpiration = {
  access_token: string;
  token_type: "bearer";
  scope: "";
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
};

type OAuthResponseData =
  | OAuthResponseDataForOAuthApps
  | OAuthResponseDataForGitHubAppsWithoutExpiration
  | OAuthResponseDataForGitHubAppsWithExpiration;

/**
 * The API endpoint to exchange an OAuth code from the web flow (`POST /login/oauth/access_token`)
 * is not part of GitHub's REST API and behaves differently.
 *
 * 1. Instead of using api.github.com, the endpoint is using github.com. On GitHub Enterprise Server,
 *    the endpoint does not use the `/api/v3` prefix.
 * 2. The endpoint always responds with a 200 status code, even if the request did not succeed.
 *    Success and error must be determined based on the response body
 * 3. The endpoint does not respond with `Content-Type: application/json` by default. The `Accept`
 *    header has to be set explicitly to `application/json`.
 * 4. The endpoint does not accept the recommended `Accept` header for GitHub's REST API:
 *    `application/vnd.github.v3+json`. It must be set to `application/json` instead.
 *
 * @param state internal state
 * @returns normalized authentication object
 */
export async function requestOAuthAccessToken(
  state: State
): Promise<OctokitResponse<OAuthResponseData, 200>> {
  // normalize request URL
  const route = /^https:\/\/(api\.)?github\.com$/.test(
    state.request.endpoint.DEFAULTS.baseUrl
  )
    ? "POST https://github.com/login/oauth/access_token"
    : `POST ${state.request.endpoint.DEFAULTS.baseUrl.replace(
        "/api/v3",
        "/login/oauth/access_token"
      )}`;

  const request = state.request;

  // (3. & 4.) compile request parameter with explict accept header
  const parameters = {
    headers: {
      accept: "application/json",
    },
    client_id: state.clientId,
    client_secret: state.clientSecret,
    code: state.code,
    redirect_uri: state.redirectUrl,
    state: state.state,
  };

  const response = await request(route, parameters);

  // (2.) handle errors by looking at response body
  if (response.data.error !== undefined) {
    throw new RequestError(
      `${response.data.error_description} (${response.data.error})`,
      response.status,
      {
        headers: response.headers,
        request: request.endpoint(route, parameters),
      }
    );
  }

  return response;
}
