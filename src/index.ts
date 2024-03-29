import { getUserAgent } from "universal-user-agent";
import { request as octokitRequest } from "@octokit/request";

import { VERSION } from "./version.js";
import { auth } from "./auth.js";
import { hook } from "./hook.js";
import type {
  State,
  OAuthAppStrategyOptions,
  GitHubAppStrategyOptions,
  OAuthAppAuthInterface,
  GitHubAppAuthInterface,
} from "./types.js";

export type {
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
} from "./types.js";

export { requiresBasicAuth } from "./requires-basic-auth.js";

export function createOAuthUserAuth(
  options: OAuthAppStrategyOptions,
): OAuthAppAuthInterface;
export function createOAuthUserAuth(
  options: GitHubAppStrategyOptions,
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
  onTokenCreated,
  ...strategyOptions
}: OAuthAppStrategyOptions | GitHubAppStrategyOptions):
  | OAuthAppAuthInterface
  | GitHubAppAuthInterface {
  const state: State = Object.assign({
    clientType,
    clientId,
    clientSecret,
    onTokenCreated,
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
