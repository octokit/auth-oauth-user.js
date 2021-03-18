import fetchMock from "fetch-mock";
import { request } from "@octokit/request";

import { createOAuthUserAuth } from "../src/index";

describe("Exchange code from OAuth web flow", () => {
  test("README example", async () => {
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
          client_id: "1234567890abcdef1234",
          client_secret: "secret",
          code: "code123",
          redirect_uri: "https://acme-inc.com/login",
          state: "state123",
        },
      }
    );

    const auth = createOAuthUserAuth({
      clientId: "1234567890abcdef1234",
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
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],
    });
  });

  test.only("GitHub App credentials", async () => {
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
          client_id: "lv1.1234567890abcdef",
          client_secret: "secret",
          code: "code123",
          redirect_uri: "https://acme-inc.com/login",
          state: "state123",
        },
      }
    );

    const auth = createOAuthUserAuth({
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
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
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      token: "token123",
    });
  });

  test("GitHub App credentials with expiring tokens enabled", async () => {
    const mock = fetchMock.sandbox().postOnce(
      "https://github.com/login/oauth/access_token",
      {
        body: {
          access_token: "token123",
          scope: "",
          token_type: "bearer",
          expires_in: 28800,
          refresh_token: "r1.token123",
          refresh_token_expires_in: 15897600,
        },
        headers: {
          date: "Thu, 1 Jan 1970 00:00:00 GMT",
        },
      },
      {
        headers: {
          accept: "application/json",
          "user-agent": "test",
          "content-type": "application/json; charset=utf-8",
        },
        body: {
          client_id: "lv1.1234567890abcdef",
          client_secret: "secret",
          code: "code123",
          redirect_uri: "https://acme-inc.com/login",
          state: "state123",
        },
      }
    );

    const auth = createOAuthUserAuth({
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
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
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      token: "token123",
      expiresAt: "1970-01-01T08:00:00.000Z",
      refreshToken: "r1.token123",
      refreshTokenExpiresAt: "1970-07-04T00:00:00.000Z",
    });
  });
});

describe("OAuth device flow", () => {
  test("README example", async () => {
    const mock = fetchMock
      .sandbox()

      .postOnce(
        "https://github.com/login/device/code",
        {
          device_code: "devicecode123",
          user_code: "usercode123",
          verification_uri: "https://github.com/login/device",
          expires_in: 900,
          // use low number because jest.useFakeTimers() & jest.runAllTimers() didn't work for me
          interval: 0.005,
        },
        {
          headers: {
            accept: "application/json",
            "user-agent": "test",
            "content-type": "application/json; charset=utf-8",
          },
          body: {
            client_id: "1234567890abcdef1234",
            scope: "",
          },
        }
      )
      .postOnce(
        "https://github.com/login/oauth/access_token",
        {
          access_token: "token123",
          scope: "",
        },
        {
          headers: {
            accept: "application/json",
            "user-agent": "test",
            "content-type": "application/json; charset=utf-8",
          },
          body: {
            client_id: "1234567890abcdef1234",
            device_code: "devicecode123",
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          },
          overwriteRoutes: false,
        }
      );

    const onVerification = jest.fn();
    const auth = createOAuthUserAuth({
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      onVerification,
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
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],
    });

    expect(onVerification).toHaveBeenCalledWith({
      device_code: "devicecode123",
      expires_in: 900,
      interval: 0.005,
      user_code: "usercode123",
      verification_uri: "https://github.com/login/device",
    });
  });
});

describe("Use existing authentication", () => {
  test("README example", async () => {
    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],
    });

    // will return the passed authentication
    const authentication = await auth();

    expect(authentication).toEqual({
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      clientType: "oauth-app",
      scopes: [],
      token: "token123",
      tokenType: "oauth",
      type: "token",
    });
  });
});
