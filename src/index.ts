import { getUserAgent } from "universal-user-agent";
import { request as octokitRequest } from "@octokit/request";

import { VERSION } from "./version";
import { auth } from "./auth";
import { hook } from "./hook";
import {
  State,
  OAuthAppStrategyOptions,
  GitHubAppStrategyOptions,
  OAuthAppAuthInterface,
  GitHubAppAuthInterface,
} from "./types";
export {
  OAuthAppStrategyOptionsWebFlow,
  GitHubAppStrategyOptionsWebFlow,
  OAuthAppStrategyOptionsDeviceFlow,
  GitHubAppStrategyOptionsDeviceFlow,
  OAuthAppStrategyOptionsExistingAuthentication,
  GitHubAppStrategyOptionsExistingAuthentication,
  GitHubAppStrategyOptionsExistingAuthenticationWithExpiration,
  OAuthAppStrategyOptions,
  GitHubAppStrategyOptions,
  OAuthAppAuthOptions,
  GitHubAppAuthOptions,
  OAuthAppAuthentication,
  GitHubAppAuthentication,
  GitHubAppAuthenticationWithExpiration,
} from "./types";

export function createOAuthUserAuth(
  options: OAuthAppStrategyOptions
): OAuthAppAuthInterface;
export function createOAuthUserAuth(
  options: GitHubAppStrategyOptions
): GitHubAppAuthInterface;

export function createOAuthUserAuth({
  clientId,
  clientSecret,
  clientType = "oauth-app",
  request = octokitRequest.defaults({
    headers: {
      "user-agent": `octokit-auth-oauth-app.js/${VERSION} ${getUserAgent()}`,
    },
  }),
  ...strategyOptions
}: OAuthAppStrategyOptions | GitHubAppStrategyOptions):
  | OAuthAppAuthInterface
  | GitHubAppAuthInterface {
  const state: State = Object.assign({
    clientType,
    clientId,
    clientSecret,
    strategyOptions,
    request,
  });

  // @ts-expect-error not worth the extra code needed to appease TS
  return Object.assign(auth.bind(null, state), {
    // @ts-expect-error not worth the extra code needed to appease TS
    hook: hook.bind(null, state),
  });
}

createOAuthUserAuth.VERSION = VERSION;
