# Papirfly brand portal
***(For this example, we use the fictitious brand portal auth.example.papirfly.com)***
<br><br>
Go to Setup-> OAuth to create your app. *(auth.example.papirfly.com/portal/setup-oauth)*

For the Authorization callback URL, choose something like `${window.location.origin}/oauth/authorized`.

```ts
const config = {
    grantType: "authorization_code",
    clientId: "<YOUR_CLIENT_ID>",
    scopes: ["dam:read"],
    serviceConfiguration: {
        authorizationEndpoint: "https://auth.example.papirfly.com/api/oauth/authorize",
        tokenEndpoint: "https://auth.example.papirfly.com/api/oauth/token",
    },
    redirectConfiguration: {
        url: `${window.location.origin}/oauth/authorized`,
        authorizedMessage: "oauth-authorized",
        rejectedMessage: "oauth-rejected",
    },
};

// Log in to get an authentication token
const authState = await authorizeWithAuthorizationCode(config);
```
