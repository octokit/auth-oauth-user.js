import * as OctokitTypes from "@octokit/types";
import * as DeviceTypes from "@octokit/auth-oauth-device";
import * as OAuthMethodsTypes from "@octokit/oauth-methods";

export type ClientType = "oauth-app" | "github-app";

type CommonStrategyOptions<TClientType extends ClientType> = {
  clientType?: TClientType;
  clientId: string;
  clientSecret: string;
  request?: OctokitTypes.RequestInterface;
};

export type WebFlowOptions = {
  code: string;
  state?: string;
  redirectUrl?: string;
};

type DeviceFlowOptions = {
  onVerification: DeviceTypes.OAuthAppStrategyOptions["onVerification"];
  scopes?: string[];
};
type ExistingOAuthAppAuthenticationOptions = {
  token: string;
  scopes: string[];
};
type ExistingGitHubAppAuthenticationOptions = {
  token: string;
};
type ExistingGitHubAppAuthenticationWithExpirationOptions = {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
};

export interface AuthInterface<TClientType extends ClientType> {
  (): Promise<Authentication<TClientType>>;

  hook(
    request: OctokitTypes.RequestInterface,
    route: OctokitTypes.Route | OctokitTypes.EndpointOptions,
    parameters?: OctokitTypes.RequestParameters
  ): Promise<OctokitTypes.OctokitResponse<any>>;
}

export type StrategyOptionsExistingOAuthAppAuthentication = CommonStrategyOptions<"oauth-app"> &
  ExistingOAuthAppAuthenticationOptions & { clientType: "oauth-app" };

export type StrategyOptionsExistingGitHubAppAuthentication = CommonStrategyOptions<"github-app"> &
  ExistingGitHubAppAuthenticationOptions & { clientType: "github-app" };

export type StrategyOptionsExistingGitHubAppAuthenticationWithExpiration = CommonStrategyOptions<"github-app"> &
  ExistingGitHubAppAuthenticationWithExpirationOptions & {
    clientType: "github-app";
  };

type StrategyOptionsWebFlow<
  TClientType extends ClientType
> = CommonStrategyOptions<TClientType> & WebFlowOptions;
type StrategyOptionsDeviceFlow<
  TClientType extends ClientType
> = CommonStrategyOptions<TClientType> & DeviceFlowOptions;
type StrategyOptionsExistingAuthentication<
  TClientType extends ClientType
> = TClientType extends "oauth-app"
  ? StrategyOptionsExistingOAuthAppAuthentication
  :
      | StrategyOptionsExistingGitHubAppAuthentication
      | StrategyOptionsExistingGitHubAppAuthenticationWithExpiration;

export type StrategyOptions<TClientType extends ClientType = "oauth-app"> =
  | StrategyOptionsWebFlow<TClientType>
  | StrategyOptionsDeviceFlow<TClientType>
  | StrategyOptionsExistingAuthentication<TClientType>;

export type Authentication<TClientType extends ClientType> = {
  tokenType: "oauth";
  type: "token";
} & (TClientType extends "oauth-app"
  ? OAuthMethodsTypes.OAuthAppAuthentication
  :
      | OAuthMethodsTypes.GitHubAppAuthentication
      | OAuthMethodsTypes.GitHubAppAuthenticationWithExpiration);

type OAuthAppState = {
  clientId: string;
  clientSecret: string;
  clientType: "oauth-app";
  request: OctokitTypes.RequestInterface;
  strategyOptions:
    | WebFlowOptions
    | DeviceFlowOptions
    | ExistingOAuthAppAuthenticationOptions;
  authentication?: Authentication<"oauth-app">;
};

type GitHubAppState = {
  clientId: string;
  clientSecret: string;
  clientType: "github-app";
  request: OctokitTypes.RequestInterface;
  strategyOptions:
    | WebFlowOptions
    | DeviceFlowOptions
    | ExistingGitHubAppAuthenticationOptions
    | ExistingGitHubAppAuthenticationWithExpirationOptions;
  authentication?: Authentication<"github-app">;
};

export type State = OAuthAppState | GitHubAppState;

export type WebFlowState = {
  clientId: string;
  clientSecret: string;
  clientType: ClientType;
  request: OctokitTypes.RequestInterface;
  strategyOptions: WebFlowOptions;
};
