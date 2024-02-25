import { Octokit } from "@octokit/core";
import fetchMock, { MockMatcherFunction } from "fetch-mock";

import { createOAuthUserAuth } from "../src/index";

describe("Octokit + OAuth web flow", () => {
  it("README example", async () => {
    const matchCreateTokenRequest: MockMatcherFunction = (url, options) => {
      expect(url).toEqual("https://github.com/login/oauth/access_token");
      expect(options.headers).toEqual(
        expect.objectContaining({
          accept: "application/json",
          "content-type": "application/json; charset=utf-8",
        }),
      );

      return true;
    };

    const matchGetUserRequest: MockMatcherFunction = (url, options) => {
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
      .sandbox()
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
        fetch: mock,
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
    const matchCreateTokenRequest: MockMatcherFunction = (url, options) => {
      expect(url).toEqual("https://github.com/login/oauth/access_token");
      expect(options.headers).toEqual(
        expect.objectContaining({
          accept: "application/json",
          "content-type": "application/json; charset=utf-8",
        }),
      );

      return true;
    };

    const matchGetUserRequest: MockMatcherFunction = (url, options) => {
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
      .sandbox()
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
        fetch: mock,
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
  const matchCheckTokenRequest: MockMatcherFunction = (url, options) => {
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
    .sandbox()
    .postOnce(matchCheckTokenRequest, { ok: true });

  const octokit = new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      clientId: "1234567890abcdef1234",
      clientSecret: "1234567890abcdef1234567890abcdef12345678",
      code: "code123",
    },
    request: {
      fetch: mock,
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
  const matchCreateTokenRequest: MockMatcherFunction = (url, options) => {
    expect(url).toEqual("https://github.com/login/oauth/access_token");
    // @ts-ignore
    expect(options.headers.authorization).toBeUndefined();

    return true;
  };

  const mock = fetchMock
    .sandbox()
    .postOnce(matchCreateTokenRequest, { ok: true });

  const octokit = new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      clientId: "1234567890abcdef1234",
      clientSecret: "1234567890abcdef1234567890abcdef12345678",
      code: "code123",
    },
    request: {
      fetch: mock,
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
