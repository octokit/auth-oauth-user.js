import { describe, expect, it, test, vi } from "vitest";
import fetchMock from "fetch-mock";
import MockDate from "mockdate";
import { request } from "@octokit/request";

import { createOAuthUserAuth } from "../src/index.js";

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
        },
      },
    );

    const auth = createOAuthUserAuth({
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      code: "code123",
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

  test("GitHub App credentials", async () => {
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
        },
      },
    );

    const auth = createOAuthUserAuth({
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      code: "code123",
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
        },
      },
    );

    const auth = createOAuthUserAuth({
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      code: "code123",
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

    MockDate.set(0);
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
          // use low number because vi.useFakeTimers() & vi.runAllTimers() didn't work for me
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
        },
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
        },
      );

    const onVerification = vi.fn();
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

test("Invalid strategy options", async () => {
  // @ts-expect-error
  const auth = createOAuthUserAuth({});

  await expect(async () => await auth()).rejects.toThrow(
    "[@octokit/auth-oauth-user] Invalid strategy options",
  );
});

test("Caches authentication for successive calls", async () => {
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
      },
    },
  );

  const auth = createOAuthUserAuth({
    clientId: "1234567890abcdef1234",
    clientSecret: "secret",
    code: "code123",
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

  const authentication2 = await auth();

  expect(authentication).toEqual(authentication2);
});

describe("refreshing tokens", () => {
  test("auto-refreshing for expiring tokens", async () => {
    const mock = fetchMock.sandbox().postOnce(
      (url, options) => {
        expect(url).toEqual("https://github.com/login/oauth/access_token");
        expect(options.headers).toEqual(
          expect.objectContaining({
            accept: "application/json",
            "content-type": "application/json; charset=utf-8",
          }),
        );
        expect(JSON.parse(options.body as string)).toEqual({
          client_id: "lv1.1234567890abcdef",
          client_secret: "secret",
          refresh_token: "r1.token123",
          grant_type: "refresh_token",
        });

        return true;
      },
      {
        body: {
          access_token: "token456",
          scope: "",
          token_type: "bearer",
          expires_in: 28800,
          refresh_token: "r1.token456",
          refresh_token_expires_in: 15897600,
        },
        headers: {
          date: "Thu, 1 Jan 1970 10:00:00 GMT",
        },
      },
    );

    const auth = createOAuthUserAuth({
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      token: "token123",
      expiresAt: "1970-01-01T08:00:00.000Z",
      refreshToken: "r1.token123",
      refreshTokenExpiresAt: "1970-07-04T00:00:00.000Z",

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

    MockDate.set(0);
    const authentication1 = await auth();

    expect(authentication1).toEqual({
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

    // not yet expired
    MockDate.set("1970-01-01T05:00:00.000Z");
    const authentication2 = await auth();
    expect(authentication2).toEqual(authentication1);

    // expired
    MockDate.set("1970-01-01T10:00:00.000Z");
    const authentication3 = await auth();

    expect(authentication3).toEqual({
      type: "token",
      tokenType: "oauth",
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      token: "token456",
      expiresAt: "1970-01-01T18:00:00.000Z",
      refreshToken: "r1.token456",
      refreshTokenExpiresAt: "1970-07-04T10:00:00.000Z",
    });

    MockDate.reset();
  });

  test('auth({ type: "refresh" })', async () => {
    const mock = fetchMock.sandbox().postOnce(
      (url, options) => {
        expect(url).toEqual("https://github.com/login/oauth/access_token");
        expect(options.headers).toEqual(
          expect.objectContaining({
            accept: "application/json",
            "content-type": "application/json; charset=utf-8",
          }),
        );
        expect(JSON.parse(options.body as string)).toEqual({
          client_id: "lv1.1234567890abcdef",
          client_secret: "secret",
          refresh_token: "r1.token123",
          grant_type: "refresh_token",
        });

        return true;
      },
      {
        body: {
          access_token: "token456",
          scope: "",
          token_type: "bearer",
          expires_in: 28800,
          refresh_token: "r1.token456",
          refresh_token_expires_in: 15897600,
        },
        headers: {
          date: "Thu, 1 Jan 1970 00:00:00 GMT",
        },
      },
    );

    const auth = createOAuthUserAuth({
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      token: "token123",
      expiresAt: "1970-01-01T08:00:00.000Z",
      refreshToken: "r1.token123",
      refreshTokenExpiresAt: "1970-07-04T00:00:00.000Z",

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

    MockDate.set(0);
    const authentication = await auth({ type: "refresh" });

    expect(authentication).toEqual({
      type: "token",
      tokenType: "oauth",
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      token: "token456",
      expiresAt: "1970-01-01T08:00:00.000Z",
      refreshToken: "r1.token456",
      refreshTokenExpiresAt: "1970-07-04T00:00:00.000Z",
    });

    MockDate.reset();
  });

  test('auth({ type: "refresh" }) with "onTokenCreated()" option', async () => {
    const mock = fetchMock.sandbox().postOnce(
      (url, options) => {
        expect(url).toEqual("https://github.com/login/oauth/access_token");
        expect(options.headers).toEqual(
          expect.objectContaining({
            accept: "application/json",
            "content-type": "application/json; charset=utf-8",
          }),
        );
        expect(JSON.parse(options.body as string)).toEqual({
          client_id: "lv1.1234567890abcdef",
          client_secret: "secret",
          refresh_token: "r1.token123",
          grant_type: "refresh_token",
        });

        return true;
      },
      {
        body: {
          access_token: "token456",
          scope: "",
          token_type: "bearer",
          expires_in: 28800,
          refresh_token: "r1.token456",
          refresh_token_expires_in: 15897600,
        },
        headers: {
          date: "Thu, 1 Jan 1970 00:00:00 GMT",
        },
      },
    );

    const expectedAuthenticationObject = {
      type: "token",
      tokenType: "oauth",
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      token: "token456",
      expiresAt: "1970-01-01T08:00:00.000Z",
      refreshToken: "r1.token456",
      refreshTokenExpiresAt: "1970-07-04T00:00:00.000Z",
    };

    const auth = createOAuthUserAuth({
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      token: "token123",
      expiresAt: "1970-01-01T08:00:00.000Z",
      refreshToken: "r1.token123",
      refreshTokenExpiresAt: "1970-07-04T00:00:00.000Z",
      onTokenCreated: (authentication, options) => {
        expect(authentication).toStrictEqual(expectedAuthenticationObject);
        expect(options).toStrictEqual({ type: "refresh" });
      },

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

    MockDate.set(0);
    const authentication = await auth({ type: "refresh" });

    expect(authentication).toEqual(expectedAuthenticationObject);

    expect.assertions(6);

    MockDate.reset();
  });

  test('auth({ type: "refresh" }) with OAuth App token', async () => {
    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],
    });

    // @ts-expect-error "refresh" is not permitted for OAuth Apps
    await expect(async () => await auth({ type: "refresh" })).rejects.toThrow(
      "[@octokit/auth-oauth-user] OAuth Apps do not support expiring tokens",
    );
  });

  test('auth({ type: "refresh" }) without refresh token', async () => {
    const auth = createOAuthUserAuth({
      clientType: "github-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
    });

    await expect(async () => await auth({ type: "refresh" })).rejects.toThrow(
      "[@octokit/auth-oauth-user] Refresh token missing",
    );
  });
});

describe("auth({ type: 'get' })", () => {
  it("is valid", async () => {
    const mock = fetchMock.sandbox().postOnce(
      "https://api.github.com/applications/1234567890abcdef1234/token",
      {
        scopes: [],
      },
      {
        headers: {
          accept: "application/vnd.github.v3+json",
          "user-agent": "test",
          authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
          "content-type": "application/json; charset=utf-8",
        },
        body: { access_token: "token123" },
      },
    );

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],

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

    const authentication1 = await auth({
      type: "get",
    });
    const authentication2 = await auth({
      type: "get",
    });

    expect(authentication1).toEqual({
      type: "token",
      tokenType: "oauth",
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],
    });
    expect(authentication1).toEqual(authentication2);
  });
});

describe("auth({ type: 'check' })", () => {
  it("is valid", async () => {
    const mock = fetchMock.sandbox().postOnce(
      "https://api.github.com/applications/1234567890abcdef1234/token",
      {
        scopes: [],
      },
      {
        headers: {
          accept: "application/vnd.github.v3+json",
          "user-agent": "test",
          authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
          "content-type": "application/json; charset=utf-8",
        },
        body: { access_token: "token123" },
      },
    );

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],

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

    const authentication = await auth({
      type: "check",
    });

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

  it("calls 'onTokenCreated' if defined as auth option", async () => {
    const mock = fetchMock.sandbox().postOnce(
      "https://api.github.com/applications/1234567890abcdef1234/token",
      {
        scopes: [],
      },
      {
        headers: {
          accept: "application/vnd.github.v3+json",
          "user-agent": "test",
          authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
          "content-type": "application/json; charset=utf-8",
        },
        body: { access_token: "token123" },
      },
    );

    const expectedAuthenticationObject = {
      type: "token",
      tokenType: "oauth",
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],
    };

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],
      onTokenCreated: (authentication, options) => {
        expect(authentication).toStrictEqual(expectedAuthenticationObject);
        expect(options).toStrictEqual({ type: "check" });
      },

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

    const authentication = await auth({
      type: "check",
    });

    expect(authentication).toEqual(expectedAuthenticationObject);

    // Assures onTokenCreated() has not been invoked
    expect.assertions(1);
  });

  it("is not valid", async () => {
    const mock = fetchMock
      .sandbox()
      .postOnce(
        "https://api.github.com/applications/1234567890abcdef1234/token",
        404,
      );

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],

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

    await expect(
      async () =>
        await auth({
          type: "check",
        }),
    ).rejects.toThrow("[@octokit/auth-oauth-user] Token is invalid");

    // rejects without sending another request
    await expect(async () => await auth()).rejects.toThrow(
      "[@octokit/auth-oauth-user] Token is invalid",
    );
  });
});

describe("auth({ type: 'reset' })", () => {
  it("uses new authentication after reset", async () => {
    const mock = fetchMock
      .sandbox()
      .patchOnce(
        "https://api.github.com/applications/1234567890abcdef1234/token",
        {
          token: "token456",
          scopes: [],
        },
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": "test",
            authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
            "content-type": "application/json; charset=utf-8",
          },
          body: { access_token: "token123" },
        },
      )
      .postOnce(
        "https://api.github.com/applications/1234567890abcdef1234/token",
        {},
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": "test",
            authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
            "content-type": "application/json; charset=utf-8",
          },
          body: { access_token: "token456" },
        },
      );

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],

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

    const authentication1 = await auth({
      type: "reset",
    });

    expect(authentication1).toEqual({
      type: "token",
      tokenType: "oauth",
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token456",
      scopes: [],
    });

    await auth({
      type: "check",
    });
  });

  it("calls 'onTokenCreated' if defined as auth option", async () => {
    const mock = fetchMock
      .sandbox()
      .patchOnce(
        "https://api.github.com/applications/1234567890abcdef1234/token",
        {
          token: "token456",
          scopes: [],
        },
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": "test",
            authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
            "content-type": "application/json; charset=utf-8",
          },
          body: { access_token: "token123" },
        },
      )
      .postOnce(
        "https://api.github.com/applications/1234567890abcdef1234/token",
        {},
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": "test",
            authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
            "content-type": "application/json; charset=utf-8",
          },
          body: { access_token: "token456" },
        },
      );

    const expectedAuthenticationObject = {
      type: "token",
      tokenType: "oauth",
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token456",
      scopes: [],
    };

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],
      onTokenCreated: (authentication, options) => {
        expect(authentication).toStrictEqual(expectedAuthenticationObject);
        expect(options).toStrictEqual({ type: "reset" });
      },

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

    const authentication1 = await auth({
      type: "reset",
    });

    expect(authentication1).toEqual(expectedAuthenticationObject);

    expect.assertions(3);
  });

  it("reset fails due to invalid token", async () => {
    const mock = fetchMock
      .sandbox()
      .patchOnce(
        "https://api.github.com/applications/1234567890abcdef1234/token",
        404,
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": "test",
            authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
            "content-type": "application/json; charset=utf-8",
          },
          body: { access_token: "token123" },
        },
      );

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],

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

    await expect(
      async () =>
        await auth({
          type: "reset",
        }),
    ).rejects.toThrow("[@octokit/auth-oauth-user] Token is invalid");
  });
});

describe("auth({ type: 'delete' })", () => {
  it("invalidates authentication for successive calls", async () => {
    const mock = fetchMock
      .sandbox()
      .deleteOnce(
        "https://api.github.com/applications/1234567890abcdef1234/token",
        204,
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": "test",
            authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
            "content-type": "application/json; charset=utf-8",
          },
          body: { access_token: "token123" },
        },
      );

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],

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

    await auth({
      type: "delete",
    });

    await expect(
      async () =>
        await await auth({
          type: "check",
        }),
    ).rejects.toThrow("[@octokit/auth-oauth-user] Token is invalid");
  });

  it("does not throw in case the token is already invalid", async () => {
    const mock = fetchMock
      .sandbox()
      .deleteOnce(
        "https://api.github.com/applications/1234567890abcdef1234/token",
        404,
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": "test",
            authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
            "content-type": "application/json; charset=utf-8",
          },
          body: { access_token: "token123" },
        },
      );

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],

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

    expect(
      await auth({
        type: "delete",
      }),
    ).toEqual(expect.objectContaining({ invalid: true }));
  });
});

describe("auth({ type: 'deleteAuthorization' })", () => {
  it("invalidates authentication for successive calls", async () => {
    const mock = fetchMock
      .sandbox()
      .deleteOnce(
        "https://api.github.com/applications/1234567890abcdef1234/grant",
        204,
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": "test",
            authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
            "content-type": "application/json; charset=utf-8",
          },
          body: { access_token: "token123" },
        },
      );

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],

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

    await auth({
      type: "deleteAuthorization",
    });

    await expect(
      async () =>
        await await auth({
          type: "check",
        }),
    ).rejects.toThrow("[@octokit/auth-oauth-user] Token is invalid");
  });

  it("does not throw in case the token is already invalid", async () => {
    const mock = fetchMock
      .sandbox()
      .deleteOnce(
        "https://api.github.com/applications/1234567890abcdef1234/grant",
        404,
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": "test",
            authorization: "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6c2VjcmV0",
            "content-type": "application/json; charset=utf-8",
          },
          body: { access_token: "token123" },
        },
      );

    const auth = createOAuthUserAuth({
      clientType: "oauth-app",
      clientId: "1234567890abcdef1234",
      clientSecret: "secret",
      token: "token123",
      scopes: [],

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

    expect(
      await auth({
        type: "deleteAuthorization",
      }),
    ).toEqual(expect.objectContaining({ invalid: true }));
  });
});
