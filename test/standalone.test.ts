import fetchMock from "fetch-mock";
import { request } from "@octokit/request";

import { createOAuthUserAuth } from "../src/index";

test("README example: Exchange code from OAuth web flow", async () => {
  const mock = fetchMock.sandbox().postOnce(
    "https://github.com/login/oauth/access_token",
    {
      access_token: "token123",
      scope: "",
      token_type: "bearer",
    },
    {
      headers: {
        accept: "application/json",
        "user-agent": "test",
        "content-type": "application/json; charset=utf-8",
      },
      body: {
        client_id: "123",
        client_secret: "secret",
        code: "code123",
        redirect_uri: "https://acme-inc.com/login",
        state: "state123",
      },
    }
  );

  const auth = createOAuthUserAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "code123",
    state: "state123",
    redirectUrl: "https://acme-inc.com/login",
    // pass request mock for testing
    request: request.defaults({
      headers: {
        "user-agent": "test",
      },
      request: {
        fetch: mock,
      },
    }),
  });

  const authentication = await auth();

  expect(authentication).toEqual({
    type: "token",
    tokenType: "oauth",
    clientType: "oauth-app",
    clientId: "123",
    token: "token123",
    scopes: [],
  });
});

test("README example: Exchange code from OAuth web flow using GitHub App credentials", async () => {
  const mock = fetchMock.sandbox().postOnce(
    "https://github.com/login/oauth/access_token",
    {
      access_token: "token123",
      scope: "",
      token_type: "bearer",
    },
    {
      headers: {
        accept: "application/json",
        "user-agent": "test",
        "content-type": "application/json; charset=utf-8",
      },
      body: {
        client_id: "lv1.123",
        client_secret: "secret",
        code: "code123",
        redirect_uri: "https://acme-inc.com/login",
        state: "state123",
      },
    }
  );

  const auth = createOAuthUserAuth({
    // The "lv1." prefix exists only for GitHub Apps
    clientId: "lv1.123",
    clientSecret: "secret",
    code: "code123",
    state: "state123",
    redirectUrl: "https://acme-inc.com/login",
    // pass request mock for testing
    request: request.defaults({
      headers: {
        "user-agent": "test",
      },
      request: {
        fetch: mock,
      },
    }),
  });

  const authentication = await auth();

  expect(authentication).toEqual({
    type: "token",
    tokenType: "oauth",
    clientType: "github-app",
    clientId: "lv1.123",
    token: "token123",
  });
});
