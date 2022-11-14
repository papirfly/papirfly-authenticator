<p align="center">
    <picture >
      <source media="(prefers-color-scheme: dark)" srcset="https://brand.papirfly.com/fr/gallery/34433/images/lowres/00a0679f-ece6-41a0-8039-be5ec0fe6700.png">
      <source media="(prefers-color-scheme: light)" srcset="https://brand.papirfly.com/fr/gallery/34433/images/lowres/24ced107-4a60-45ef-8be5-c14cfe133908.png">
      <img alt="Shows the papirfly logo" src="https://brand.papirfly.com/fr/gallery/34433/images/lowres/24ced107-4a60-45ef-8be5-c14cfe133908.png" height=100>
    </picture>
</p>
<h2 align="center">Papirfly authenticator</h2>
<p align="center">
<strong>Authorize your secure web app with a Papirfly brand portal.</strong>
<br><br>

[![Maintenance Status][maintenance-image]](#maintenance-status)

### Why you may want to use this library

The Papirfly authenticator is a OAuth client implementation, that allows you to quickly integrate towards a 
papirfly brand portal, either through using the [Authorization code flow](https://www.rfc-editor.org/rfc/rfc6749#section-1.3.1) or the [Client credentials flow](https://www.rfc-editor.org/rfc/rfc6749#section-1.3.4).

The Papirfly authenticator also supports the [PKCE](https://tools.ietf.org/html/rfc7636) ("Pixy") extension to OAuth.

Note: While this client will work towards most OAuth2 Servers, it officially only supports Papirfly Brand Portal.

## Supported methods

### `authorizeWithAuthorizationCode`

This is the main and preferred function to use for authentication. Invoking this function will do the whole login
flow, opening a popup and returns the access token, refresh token and access token expiry date when successful, or it
throws an error when not successful.

```ts
import { authorizeWithAuthorizationCode } from "@papirfly/papirfly-authenticator";

const config = {
    grantType: "authorization_code",
    clientId: "<YOUR_CLIENT_ID>",
    scopes: ["<YOUR_SCOPES_ARRAY>"],
    serviceConfiguration: {
        authorizationEndpoint: "<FULL_URL_TO_AUTHORIZATION_ENDPOINT>",
        tokenEndpoint: "<FULL_URL_TO_TOKEN_ENDPOINT>",
    },
    redirectConfiguration: {
        url: "<YOUR_REDIRECT_URL>",
        authorizedMessage: "<NAME_OF_SUCCSESSFUL_AUTHORIZATION_MESSAGE>",
        rejectedMessage: "<NAME_OF_REJECTED_AUTHORIZATION_MESSAGE>",
    },
};

const result = await authorizeWithAuthorizationCode(config);
```
### `authorizeWithClientCredentials`

This method allows you to authenticate without using a popup. Invoking this function will do the whole login
flow and returns the access token, refresh token and access token expiry date when successful, or it
throws an error when not successful.

```ts
import { authorizeWithClientCredentials } from "@papirfly/papirfly-authenticator";

const config = {
    grantType: "client_credentials",
    clientId: "<YOUR_CLIENT_ID>",
    clientSecret: "<YOUR_CLIENT_SECRET>",
    scopes: ["<YOUR_SCOPES_ARRAY>"],
    serviceConfiguration: {
        authorizationEndpoint: "<FULL_URL_TO_AUTHORIZATION_ENDPOINT>",
        tokenEndpoint: "<FULL_URL_TO_TOKEN_ENDPOINT>",
    },
};

const result = await authorizeWithClientCredentials(config);
```


### `refresh`

This method will refresh the accessToken using the refreshToken.

```ts
import { refresh } from "@papirfly/papirfly-authenticator";

const config = { "<CONFIG_USED_DURING_INITIAL_AUTHORIZATION>"};

const result = await refresh(config, {
    refreshToken: `<REFRESH_TOKEN>`,
});
```

## Getting started

```sh
npm install @papirfly/papirfly-authenticator --save
```

### Error messages

You can catch errors by adding a `throwError` function in your configurations. This will return a Error object and the configuration used to cause the error.

#### Maintenance Status

**Active:** Papirfly is actively working on this project, and we expect to continue working on it for the foreseeable future.
Bug reports, feature requests and pull requests are welcome!

[maintenance-image]: https://img.shields.io/badge/maintenance-active-green.svg
