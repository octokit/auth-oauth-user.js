import { AuthOptions, Authentication, State } from "./types";

export async function auth(
  state: State,
  options: AuthOptions
): Promise<Authentication> {
  console.log("TODO: implement auth", state, options);
}
