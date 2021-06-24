import * as OctokitTypes from "@octokit/types";
import * as DeviceTypes from "@octokit/auth-oauth-device";
import * as OAuthMethodsTypes from "@octokit/oauth-methods";

export type ClientType = "oauth-app" | "github-app";

export type WebFlowOptions = {
  code: string;
  state?: string;
  redirectUrl?: string;
};

// STRATEGY OPTIONS

type CommonOAuthAppStrategyOptions = {
  clientType?: "oauth-app";
  clientId: string;
  clientSecret: string;
  request?: OctokitTypes.RequestInterface;
};
type CommonGitHubAppStrategyOptions = {
  clientType?: "github-app";
  clientId: string;
  clientSecret: string;
  request?: OctokitTypes.RequestInterface;
};

type OAuthAppDeviceFlowOptions = {
  onVerification: DeviceTypes.OAuthAppStrategyOptions["onVerification"];
  scopes?: string[];
};
type GitHubDeviceFlowOptions = {
  onVerification: DeviceTypes.OAuthAppStrategyOptions["onVerification"];
};
type ExistingOAuthAppAuthenticationOptions = {
  clientType: "oauth-app";
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

export type OAuthAppStrategyOptionsWebFlow = CommonOAuthAppStrategyOptions &
  WebFlowOptions;
export type GitHubAppStrategyOptionsWebFlow = CommonGitHubAppStrategyOptions &
  WebFlowOptions;

export type OAuthAppStrategyOptionsDeviceFlow = CommonOAuthAppStrategyOptions &
  OAuthAppDeviceFlowOptions;
export type GitHubAppStrategyOptionsDeviceFlow =
  CommonGitHubAppStrategyOptions & GitHubDeviceFlowOptions;

export type OAuthAppStrategyOptionsExistingAuthentication =
  CommonOAuthAppStrategyOptions & ExistingOAuthAppAuthenticationOptions;

export type GitHubAppStrategyOptionsExistingAuthentication =
  CommonGitHubAppStrategyOptions & ExistingGitHubAppAuthenticationOptions;

export type GitHubAppStrategyOptionsExistingAuthenticationWithExpiration =
  CommonGitHubAppStrategyOptions &
    ExistingGitHubAppAuthenticationWithExpirationOptions;

export type OAuthAppStrategyOptions =
  | OAuthAppStrategyOptionsWebFlow
  | OAuthAppStrategyOptionsDeviceFlow
  | OAuthAppStrategyOptionsExistingAuthentication;
export type GitHubAppStrategyOptions =
  | GitHubAppStrategyOptionsWebFlow
  | GitHubAppStrategyOptionsDeviceFlow
  | GitHubAppStrategyOptionsExistingAuthentication
  | GitHubAppStrategyOptionsExistingAuthenticationWithExpiration;

// AUTHENTICATION

export type OAuthAppAuthentication = {
  tokenType: "oauth";
  type: "token";
} & OAuthMethodsTypes.OAuthAppAuthentication;

export type GitHubAppAuthentication = {
  tokenType: "oauth";
  type: "token";
} & OAuthMethodsTypes.GitHubAppAuthentication;
export type GitHubAppAuthenticationWithExpiration = {
  tokenType: "oauth";
  type: "token";
} & OAuthMethodsTypes.GitHubAppAuthenticationWithExpiration;

// INTERFACE

export interface OAuthAppAuthInterface {
  (options?: OAuthAppAuthOptions): Promise<OAuthAppAuthentication>;

  hook(
    request: OctokitTypes.RequestInterface,
    route: OctokitTypes.Route | OctokitTypes.EndpointOptions,
    parameters?: OctokitTypes.RequestParameters
  ): Promise<OctokitTypes.OctokitResponse<any>>;
}

export interface GitHubAppAuthInterface {
  (options?: GitHubAppAuthOptions): Promise<
    GitHubAppAuthentication | GitHubAppAuthenticationWithExpiration
  >;

  hook(
    request: OctokitTypes.RequestInterface,
    route: OctokitTypes.Route | OctokitTypes.EndpointOptions,
    parameters?: OctokitTypes.RequestParameters
  ): Promise<OctokitTypes.OctokitResponse<any>>;
}

// INTERNAL STATE

export type OAuthAppState = {
  clientId: string;
  clientSecret: string;
  clientType: "oauth-app";
  request: OctokitTypes.RequestInterface;
  strategyOptions:
    | WebFlowOptions
    | OAuthAppDeviceFlowOptions
    | ExistingOAuthAppAuthenticationOptions;
  authentication?: OAuthAppAuthentication & { invalid?: true };
};

type GitHubAppStateAuthentication = GitHubAppAuthentication & {
  invalid?: true;
};
type GitHubAppStateAuthenticationWIthExpiration =
  GitHubAppAuthenticationWithExpiration & {
    invalid?: true;
  };

export type GitHubAppState = {
  clientId: string;
  clientSecret: string;
  clientType: "github-app";
  request: OctokitTypes.RequestInterface;
  strategyOptions:
    | WebFlowOptions
    | GitHubDeviceFlowOptions
    | ExistingGitHubAppAuthenticationOptions
    | ExistingGitHubAppAuthenticationWithExpirationOptions;
  authentication?:
    | GitHubAppStateAuthentication
    | GitHubAppStateAuthenticationWIthExpiration;
};

export type State = OAuthAppState | GitHubAppState;

export type WebFlowState = {
  clientId: string;
  clientSecret: string;
  clientType: ClientType;
  request: OctokitTypes.RequestInterface;
  strategyOptions: WebFlowOptions;
};

export type OAuthAppAuthOptions = {
  type?: "get" | "check" | "reset" | "delete" | "deleteAuthorization";
};

export type GitHubAppAuthOptions = {
  type?:
    | "get"
    | "check"
    | "reset"
    | "refresh"
    | "delete"
    | "deleteAuthorization";
};
