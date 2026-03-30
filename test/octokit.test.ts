import { describe, expect, it, test, vi } from "vitest";
import { Octokit } from "@octokit/core";
import fetchMock, { type RouteMatcher } from "fetch-mock";

import { createOAuthUserAuth } from "../src/index.js";

describe("Octokit + OAuth web flow", () => {
  it("README example", async () => {
    const matchCreateTokenRequest: RouteMatcher = ({ url, options }) => {
      expect(url).toEqual("https://github.com/login/oauth/access_token");
      expect(options.headers).toEqual(
        expect.objectContaining({
          accept: "application/json",
          "content-type": "application/json; charset=utf-8",
        }),
      );

      return true;
    };

    const matchGetUserRequest: RouteMatcher = ({ url, options }) => {
      expect(url).toEqual("https://api.github.com/user");
      expect(options.headers).toEqual(
        expect.objectContaining({
          accept: "application/vnd.github.v3+json",
          authorization: "token token123",
        }),
      );

      return true;
    };

    const mock = fetchMock
      .createInstance()
      .postOnce(matchCreateTokenRequest, {
        access_token: "token123",
        scope: "",
        token_type: "bearer",
      })
      .getOnce(matchGetUserRequest, {
        login: "octocat",
      });

    const octokit = new Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientId: "1234567890abcdef1234",
        clientSecret: "1234567890abcdef1234567890abcdef12345678",
        code: "code123",
      },
      request: {
        fetch: mock.fetchHandler,
      },
    });

    // Exchanges the code for the user access token authentication on first request
    // and caches the authentication for successive requests
    const {
      data: { login },
    } = await octokit.request("GET /user");
    expect(login).toEqual("octocat");
  });

  it("GitHub App auth", async () => {
    const matchCreateTokenRequest: RouteMatcher = ({ url, options }) => {
      expect(url).toEqual("https://github.com/login/oauth/access_token");
      expect(options.headers).toEqual(
        expect.objectContaining({
          accept: "application/json",
          "content-type": "application/json; charset=utf-8",
        }),
      );

      return true;
    };

    const matchGetUserRequest: RouteMatcher = ({ url, options }) => {
      expect(url).toEqual("https://api.github.com/user");
      expect(options.headers).toEqual(
        expect.objectContaining({
          accept: "application/vnd.github.v3+json",
          authorization: "token token123",
        }),
      );

      return true;
    };

    const mock = fetchMock
      .createInstance()
      .postOnce(matchCreateTokenRequest, {
        access_token: "token123",
        scope: "",
        token_type: "bearer",
      })
      .getOnce(matchGetUserRequest, {
        login: "octocat",
      });

    const octokit = new Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: "github-app",
        clientId: "lv1.1234567890abcdef",
        clientSecret: "1234567890abcdef1234567890abcdef12345678",
        code: "code123",
      },
      request: {
        fetch: mock.fetchHandler,
      },
    });

    // Exchanges the code for the user access token authentication on first request
    // and caches the authentication for successive requests
    const {
      data: { login },
    } = await octokit.request("GET /user");
    expect(login).toEqual("octocat");
  });
});

test("Sets clientId/clientSecret as Basic auth for /authentication/{clientId}/* requests", async () => {
  const matchCheckTokenRequest: RouteMatcher = ({ url, options }) => {
    expect(url).toEqual(
      "https://api.github.com/applications/1234567890abcdef1234/token",
    );
    expect(options.headers).toEqual(
      expect.objectContaining({
        authorization:
          "basic MTIzNDU2Nzg5MGFiY2RlZjEyMzQ6MTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3OA==",
      }),
    );
    expect(JSON.parse(options.body as string)).toEqual({
      access_token: "token123",
    });

    return true;
  };

  const mock = fetchMock
    .createInstance()
    .postOnce(matchCheckTokenRequest, { ok: true });

  const octokit = new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      clientId: "1234567890abcdef1234",
      clientSecret: "1234567890abcdef1234567890abcdef12345678",
      code: "code123",
    },
    request: {
      fetch: mock.fetchHandler,
    },
  });

  // Exchanges the code for the user access token authentication on first request
  // and caches the authentication for successive requests
  const { data } = await octokit.request(
    "POST /applications/{client_id}/token",
    {
      client_id: "1234567890abcdef1234",
      access_token: "token123",
    },
  );

  expect(data).toEqual({ ok: true });
});

test("Sets no auth for OAuth Web flow requests", async () => {
  const matchCreateTokenRequest: RouteMatcher = ({ url, options }) => {
    expect(url).toEqual("https://github.com/login/oauth/access_token");
    // @ts-ignore
    expect(options.headers.authorization).toBeUndefined();

    return true;
  };

  const mock = fetchMock
    .createInstance()
    .postOnce(matchCreateTokenRequest, { ok: true });

  const octokit = new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      clientId: "1234567890abcdef1234",
      clientSecret: "1234567890abcdef1234567890abcdef12345678",
      code: "code123",
    },
    request: {
      fetch: mock.fetchHandler,
    },
  });

  // Exchanges the code for the user access token authentication on first request
  // and caches the authentication for successive requests
  const { data } = await octokit.request(
    "POST https://github.com/login/oauth/access_token",
    {
      client_id: "1234567890abcdef1234",
      client_secret: "client_secret",
      code: "code123",
    },
  );

  expect(data).toEqual({ ok: true });
});

test("Auto-refreshes expired GitHub App token once and reuses refreshed token for next request", async () => {
  const onTokenCreated = vi.fn();

  const matchRefreshRequest: RouteMatcher = ({ url, options }) => {
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
      refresh_token: "r1.old-refresh-token",
      grant_type: "refresh_token",
    });

    return true;
  };

  const matchGetUserRequestFirst: RouteMatcher = ({ url, options }) => {
    expect(url).toEqual("https://api.github.com/user");
    expect(options.headers).toEqual(
      expect.objectContaining({
        accept: "application/vnd.github.v3+json",
        authorization: "token token456",
      }),
    );

    return true;
  };

  const matchGetUserRequestSecond: RouteMatcher = ({ url, options }) => {
    expect(url).toEqual("https://api.github.com/user");
    expect(options.headers).toEqual(
      expect.objectContaining({
        accept: "application/vnd.github.v3+json",
        authorization: "token token456",
      }),
    );

    return true;
  };

  const mock = fetchMock
    .createInstance()
    .post(matchRefreshRequest, {
      body: {
        access_token: "token456",
        scope: "",
        token_type: "bearer",
        expires_in: 28800,
        refresh_token: "r1.new-refresh-token",
        refresh_token_expires_in: 15897600,
      },
      headers: {
        date: "Thu, 1 Jan 2099 00:00:00 GMT",
      },
    })
    .getOnce(matchGetUserRequestFirst, {
      login: "octocat",
    })
    .getOnce(matchGetUserRequestSecond, {
      login: "octocat",
    });

  const octokit = new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      clientType: "github-app",
      clientId: "lv1.1234567890abcdef",
      clientSecret: "secret",
      token: "token123",
      expiresAt: "1970-01-01T00:00:00.000Z",
      refreshToken: "r1.old-refresh-token",
      refreshTokenExpiresAt: "1970-07-04T00:00:00.000Z",
      onTokenCreated,
    },
    request: {
      fetch: mock.fetchHandler,
    },
  });

  const {
    data: { login: login1 },
  } = await octokit.request("GET /user");
  const {
    data: { login: login2 },
  } = await octokit.request("GET /user");

  expect(login1).toEqual("octocat");
  expect(login2).toEqual("octocat");
  expect(onTokenCreated).toHaveBeenCalledTimes(0);
});
