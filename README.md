# auth-oauth-client.js

> Octokit authentication strategy for OAuth clients

[![@latest](https://img.shields.io/npm/v/@octokit/auth-oauth-client.svg)](https://www.npmjs.com/package/@octokit/auth-oauth-client)
[![Build Status](https://github.com/octokit/auth-oauth-client.js/workflows/Test/badge.svg)](https://github.com/octokit/auth-oauth-client.js/actions?query=workflow%3ATest+branch%3Amain)

## Standalone usage

<table>
<tbody valign=top align=left>
<tr><th>

Browsers

</th><td width=100%>

Load `@octokit/auth-oauth-client` directly from [cdn.skypack.dev](https://cdn.skypack.dev)

```html
<script type="module">
  import { createOAuthClientAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-client";
</script>
```

</td></tr>
<tr><th>

Node

</th><td>

Install with `npm install @octokit/core @octokit/auth-oauth-client`

```js
const { createOAuthClientAuth } = require("@octokit/auth-oauth-client");
```

</td></tr>
</tbody>
</table>

```js
const auth = createOAuthClientAuth({
  // set code from GitHub's OAuth web flow callback
  // https://docs.github.com/en/developers/apps/authorizing-oauth-apps#web-application-flow
  code: "",

  async createToken(authentication, { code }) {
    // implement the code exchange based on your environment.
    return {
      token: "", // the token
      type: "oauth", // "oauth" for OAuth Apps, "app" for GitHub Apps
      scopes: ["repo_public"], // set only for OAuth Apps
    };
  },
});

const { token } = await auth({ type: "createToken" });

// token is the OAuth access token for the granting user
```

## Usage with Octokit

<table>
<tbody valign=top align=left>
<tr><th>

Browsers

</th><td width=100%>

Load `@octokit/auth-oauth-client` and [`@octokit/core`](https://github.com/octokit/core.js) (or core-compatible module) directly from [cdn.skypack.dev](https://cdn.skypack.dev)

```html
<script type="module">
  import { Octokit } from "https://cdn.skypack.dev/@octokit/core";
  import { createOAuthClientAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-client";
</script>
```

</td></tr>
<tr><th>

Node

</th><td>

Install with `npm install @octokit/core @octokit/auth-oauth-client`. Optionally replace `@octokit/core` with a compatible module

```js
const { Octokit } = require("@octokit/core");
const { createOAuthClientAuth } = require("@octokit/auth-oauth-client");
```

</td></tr>
</tbody>
</table>

```js
const octokit = new Octokit({
  authStrategy: createOAuthClientAuth,
  auth: {
    // set code from GitHub's OAuth web flow callback
    // https://docs.github.com/en/developers/apps/authorizing-oauth-apps#web-application-flow
    code,

    async createToken(authentication) {
      // implement the code exchange based on your environment.
      return {
        token: "", // the token
        type: "oauth", // "oauth" for OAuth Apps, "app" for GitHub Apps
        scopes: ["repo_public"], // set only for OAuth Apps
      };
    },
  },
});

// OAuth code exchange for access token happens transparently on first request
const { login } = await octokit.request("GET /user");
console.log("Hello, %!", login);
```

## `createOAuthClientAuth(options)`

The `createOAuthClientAuth` method accepts a single `options` object as argument

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>options.myOption</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. Description here
      </td>
    </tr>
  </tbody>
</table>

## `auth(options)`

The async `auth()` method returned by `createOAuthClientAuth(options)` accepts the following options

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>options.myOption</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required.</strong> Description here
      </td>
    </tr>
  </tbody>
</table>

## Authentication object

The async `auth(options)` method resolves to an object with the following properties

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>type</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"myType"</code>
      </td>
    </tr>
  </tbody>
</table>

## `auth.hook(request, route, parameters)` or `auth.hook(request, options)`

`auth.hook()` hooks directly into the request life cycle. It amends the request to authenticate correctly based on the request URL.

The `request` option is an instance of [`@octokit/request`](https://github.com/octokit/request.js#readme). The `route`/`options` parameters are the same as for the [`request()` method](https://github.com/octokit/request.js#request).

`auth.hook()` can be called directly to send an authenticated request

```js
const { data: user } = await auth.hook(request, "GET /user");
```

Or it can be passed as option to [`request()`](https://github.com/octokit/request.js#request).

```js
const requestWithAuth = request.defaults({
  request: {
    hook: auth.hook,
  },
});

const { data: user } = await requestWithAuth("GET /user");
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
