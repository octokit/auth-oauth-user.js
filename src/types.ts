import * as OctokitTypes from "@octokit/types";
import * as DeviceTypes from "@octokit/auth-oauth-device";

export type ClientType = "oauth-app" | "github-app";

type StrategyOptionsWebFlow = {
  clientId: string;
  clientSecret: string;
  code: string;
  state?: string;
  redirectUrl?: string;
  request?: OctokitTypes.RequestInterface;
};

type StrategyOptionsDeviceFlow = {
  clientId: string;
  clientSecret: string;
  onVerification: DeviceTypes.StrategyOptions["onVerification"];
  request?: OctokitTypes.RequestInterface;
};

export type StrategyOptions =
  | StrategyOptionsWebFlow
  | StrategyOptionsDeviceFlow;
export type AuthOptions = any;

export type Authentication = DeviceTypes.Authentication;

export type StrategyInterface = OctokitTypes.StrategyInterface<
  [StrategyOptions],
  [AuthOptions?],
  Authentication
> & { VERSION: string };

export type State = StrategyOptions & {
  request: OctokitTypes.RequestInterface;
  clientType: ClientType;
};

export type WebFlowState = StrategyOptionsWebFlow & {
  request: OctokitTypes.RequestInterface;
  clientType: ClientType;
};
