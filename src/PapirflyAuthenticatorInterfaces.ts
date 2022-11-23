export namespace PapirflyAuthenticatorInterfaces {
    export interface IServiceConfiguration {
        /**
         * Fully formed url to the OAuth authorization endpoint.
         *
         * Usually ends with `/oauth/authorize`
         */
        authorizationEndpoint: string;
        /**
         * Fully formed url to the OAuth token exchange endpoint.
         *
         * Usually ends with `/oauth/token`
         */
        tokenEndpoint: string;

        /**
         * Preferred content-type to transfer data
         */
        contentType: "form-data" | "x-www-form-urlencoded";
    }

    export interface IBaseConfiguration {
        /**
         * Configuration for token exchange endpoints.
         */
        serviceConfiguration: IServiceConfiguration;
        /**
         * Catches any potential errors
         */
        throwError?: ((error: unknown, config: IBaseAuthConfiguration) => Promise<void>) | undefined;
    }

    export interface IBaseAuthGrant {
        grantType: OAuthGrantType;
    }

    export interface IRedirectConfiguration {
        /**
         *  URL the authorization server will redirect the user back to the application a user successfully authorizes an application.
         */
        url: string;
        /**
         * Name of message sent from redirect window on succsessful authorization.
         */
        authorizedMessage: string;
        /**
         * Name of message sent from redirect window on rejected authorization.
         */
        rejectedMessage: string;
    }

    export interface IBaseAuthConfiguration extends IBaseConfiguration, IBaseAuthGrant {
        /**
         * Public identifier for app.
         */
        clientId: string;
    }

    export interface IAuthConfiguration extends IBaseAuthConfiguration {
        grantType: "authorization_code";
        /**
         * Secret known only to the application and the authorization server. Should never be commited.
         *
         * Optional for authorization code flow.
         */
        clientSecret?: string;
        /**
         * Scope to control access and help the user identify the permissions they are granting to the application.
         */
        scopes: string[];

        /**
         * Configuration for redirect.
         * Redirect should send an Event of type "message", where the authorization code is found under code
         */
        redirectConfiguration: IRedirectConfiguration;
        /**
         * Enable Proof Key for Code Exchange (PKCE, pronounced Pixy).
         *
         * Default `true`.
         */
        usePKCE?: boolean;
    }

    export interface IAuthWithCredentialsConfiguration extends IBaseAuthConfiguration {
        grantType: "client_credentials";
        /**
         * Secret known only to the application and the authorization server.
         *
         * Mandatory for client credentials flow
         */
        clientSecret: string;
        /**
         * Scope to control access and help the user identify the permissions they are granting to the application.
         */
        scopes?: string[];
        redirectUrl?: never;
    }

    interface IBaseResult {
        /**
         * Token used for API requests.
         */
        accessToken: string;
        /**
         * Expiration date of token in milliseconds.
         */
        accessTokenExpirationDate: number;
        /**
         * Token used to refresh accesstoken when it has expired.
         */
        refreshToken?: string;
        /**
         *  Representation of how an access_token will be generated and presented for resource access calls.
         *
         *  Usually `Bearer`.
         */
        tokenType: string;
    }

    export interface IAuthorizeResult extends IBaseResult {
        /**
         * Scope of accessToken.
         */
        scopes: string[];
        authorizationCode?: string;
        codeVerifier?: string;
    }

    export interface IRefreshResult extends IBaseResult {}

    export interface IRefreshConfiguration extends IBaseAuthGrant {
        grantType: "refresh_token";
        /**
         * Token received from authorization/previous refresh.
         */
        refreshToken: string;
    }

    export interface ICodeChallenge {
        /**
         * Cryptographically random string used to verify challenge on the OAuth endpoint.
         */
        verifyer: string;
        /**
         * Cryptographically random string derived from verifyer used to verify requests on the OAuth endpoint.
         */
        challenge: string;
    }

    export interface IAuthError {
        error: string;
        error_description: string;
    }

    export type OAuthGrantType = "client_credentials" | "refresh_token" | "password" | "authorization_code";

    // https://tools.ietf.org/html/rfc6749#section-4.1.2.1
    type OAuthAuthorizationErrorCode =
        | "unauthorized_client"
        | "access_denied"
        | "unsupported_response_type"
        | "invalid_scope"
        | "server_error"
        | "temporarily_unavailable";
    // https://tools.ietf.org/html/rfc6749#section-5.2
    type OAuthTokenErrorCode =
        | "invalid_request"
        | "invalid_client"
        | "invalid_grant"
        | "unauthorized_client"
        | "unsupported_grant_type"
        | "invalid_scope";
    type AppAuthErrorCode = "popup_closed_unexpectedly" | "popup_not_opened";

    export type ErrorCode = OAuthAuthorizationErrorCode | OAuthTokenErrorCode | AppAuthErrorCode;
}
