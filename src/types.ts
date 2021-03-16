import * as OctokitTypes from "@octokit/types";
import * as DeviceTypes from "@octokit/auth-oauth-device";

export type ClientType = "oauth-app" | "github-app";

type CommonStrategyOptions = {
  clientType?: ClientType;
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
  onVerification: DeviceTypes.StrategyOptions["onVerification"];
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

export type StrategyOptionsExistingOAuthAppAuthentication = CommonStrategyOptions &
  ExistingOAuthAppAuthenticationOptions;

export type StrategyOptionsExistingGitHubAppAuthentication = CommonStrategyOptions &
  ExistingGitHubAppAuthenticationOptions;

export type StrategyOptionsExistingGitHubAppAuthenticationWithExpiration = CommonStrategyOptions &
  ExistingGitHubAppAuthenticationWithExpirationOptions;

type StrategyOptionsWebFlow = CommonStrategyOptions & WebFlowOptions;
type StrategyOptionsDeviceFlow = CommonStrategyOptions & DeviceFlowOptions;
type StrategyOptionsExistingAuthentication =
  | StrategyOptionsExistingOAuthAppAuthentication
  | StrategyOptionsExistingGitHubAppAuthentication
  | StrategyOptionsExistingGitHubAppAuthenticationWithExpiration;

export type StrategyOptions =
  | StrategyOptionsWebFlow
  | StrategyOptionsDeviceFlow
  | StrategyOptionsExistingAuthentication;
export type AuthOptions = any;

export type Authentication = DeviceTypes.Authentication;

export type StrategyInterface = OctokitTypes.StrategyInterface<
  [StrategyOptions],
  [AuthOptions?],
  Authentication
> & { VERSION: string };

type OAuthAppState = {
  clientId: string;
  clientSecret: string;
  clientType: "oauth-app";
  request: OctokitTypes.RequestInterface;
  strategyOptions:
    | WebFlowOptions
    | DeviceFlowOptions
    | ExistingOAuthAppAuthenticationOptions;
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
};

export type State = OAuthAppState | GitHubAppState;

export type WebFlowState = {
  clientId: string;
  clientSecret: string;
  clientType: ClientType;
  request: OctokitTypes.RequestInterface;
  strategyOptions: WebFlowOptions;
};
