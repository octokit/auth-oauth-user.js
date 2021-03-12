import * as OctokitTypes from "@octokit/types";

export type StrategyOptions = {
  clientId: string;
  clientSecret: string;
  code: string;
  state?: string;
  redirectUrl?: string;
  request?: OctokitTypes.RequestInterface;
};
export type AuthOptions = any;
export type Authentication = {
  type: "token";
  tokenType: "oauth";
  clientType: "oauth-app";
  clientId: string;
  token: string;
  scopes: string[];
};

export type StrategyInterface = OctokitTypes.StrategyInterface<
  [StrategyOptions],
  [AuthOptions?],
  Authentication
> & { VERSION: string };

export type State = StrategyOptions & {
  request: OctokitTypes.RequestInterface;
};
