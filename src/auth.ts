import { Authentication, State, ClientType } from "./types";
import { getAuthentication } from "./get-authentication";

export async function auth<TClientType extends ClientType>(
  state: State
): Promise<Authentication<TClientType>> {
  if (!state.authentication) {
    state.authentication = await getAuthentication(state);
  }

  return state.authentication as Authentication<TClientType>;
}
