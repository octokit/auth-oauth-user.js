import { createOAuthUserAuth } from "../src";

describe("Smoke test", () => {
  it("is a function", () => {
    expect(createOAuthUserAuth).toBeInstanceOf(Function);
  });

  it("createOAuthUserAuth.VERSION is set", () => {
    expect(createOAuthUserAuth.VERSION).toEqual("0.0.0-development");
  });
});
