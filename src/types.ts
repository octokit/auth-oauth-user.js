import * as OctokitTypes from "@octokit/types";

export type StrategyOptions = any;
export type AuthOptions = any;
export type Authentication = any;

export type StrategyInterface = OctokitTypes.StrategyInterface<
  [StrategyOptions],
  [AuthOptions?],
  Authentication
> & { VERSION: string };

export type State = StrategyOptions & {
  request: OctokitTypes.RequestInterface;
};
