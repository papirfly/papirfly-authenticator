import { PapirflyAuthenticatorInterfaces as oauth } from "./PapirflyAuthenticatorInterfaces";

/**
 * Class containing utilities for authorizing a application towards 3rd party integrations with OAuth2
 */
export class PapirflyAuthenticator {
    private static challengeMethod = { algorithm: "SHA-256", key: "S256" };

    /**
     * Authorize client with Authorization Code flow
     */
    static async authorizeWithAuthorizationCode(
        config: oauth.IAuthConfiguration
    ): Promise<oauth.IAuthorizeResult | undefined> {
        const urlParams = [
            ["response_type", "code"],
            ["client_id", config.clientId],
            ["scope", config.scopes.join("+")],
            ["redirect_uri", config.redirectConfiguration.url],
        ];

        let codeChallenge: oauth.ICodeChallenge | undefined;
        if (config.usePKCE !== false) {
            codeChallenge = await this.createChallenge();
            urlParams.push(
                ["code_challenge_method", this.challengeMethod.key],
                ["code_challenge", codeChallenge.challenge]
            );
        }
        const encodedUrlParams = urlParams
            .map(function (p) {
                return p[0] + "=" + p[1];
            })
            .join("&");
        const serviceConfiguration = config.serviceConfiguration;
        const url = `${serviceConfiguration.authorizationEndpoint}?${encodedUrlParams}`;
        const popup = open(url, "Authorize", "top=100,left=100");
        if (!popup) {
            config.throwError?.(new Error("popup_not_opened" as oauth.ErrorCode), config);
            return;
        }
        const listenForAuthenticationCode = new Promise<string>((resolve, reject) => {
            let popupHasBeenClosed = false;
            const listener = (event: MessageEvent<any>) => {
                const message = JSON.parse(event.data);
                if (message.name == config.redirectConfiguration.authorizedMessage) {
                    resolve(message.code);
                    closePopup();
                } else if (message.name == config.redirectConfiguration.rejectedMessage) {
                    reject({ error: message.error, error_description: message.error_description });
                    closePopup();
                }
            };
            addEventListener("message", listener);

            const closePopup = () => {
                if (popup) {
                    popup.close();
                }
                if (listener) {
                    removeEventListener("message", listener);
                }
                if (interval) {
                    clearInterval(interval);
                }
                popupHasBeenClosed = true;
            };
            const interval = setInterval(() => {
                if (popup && popup.closed && !popupHasBeenClosed) {
                    popupHasBeenClosed = true;
                    closePopup();
                    reject({ error: "popup_closed_unexpectedly", error_description: "popup_closed_unexpectedly" });
                }
            }, 1 * 500);
        });

        try {
            const authorizationCode = await listenForAuthenticationCode;
            const token = await this.getToken(authorizationCode, "authorization_code", config, codeChallenge?.verifyer);
            return {
                accessToken: token.access_token,
                refreshToken: token.refresh_token,
                scopes: config.scopes,
                accessTokenExpirationDate: this.getAccessTokenExpirationDate(token.expires_in),
                authorizationCode: authorizationCode,
                tokenType: token.token_type,
            };
        } catch (error) {
            config.throwError?.(error, config);
            return;
        }
    }

    /**
     * Authorize client with Client Credentials flow
     */
    static async authorizeWithClientCredentials(
        config: oauth.IAuthWithCredentialsConfiguration
    ): Promise<oauth.IAuthorizeResult | undefined> {
        try {
            const token = await this.getToken(config.clientSecret, "client_credentials", config);
            return {
                accessToken: token.access_token,
                refreshToken: token.refresh_token,
                scopes: config.scopes || [],
                accessTokenExpirationDate: this.getAccessTokenExpirationDate(token.expires_in),
                tokenType: token.token_type,
            };
        } catch (error) {
            config.throwError?.(error, config);
            return;
        }
    }

    /**
     * Refresh OAuth session
     */
    static refresh: (
        config: oauth.IAuthConfiguration | oauth.IAuthWithCredentialsConfiguration,
        refreshConfig: oauth.IRefreshConfiguration
    ) => Promise<oauth.IRefreshResult | undefined> = async (config, refreshConfig) => {
        const body = new FormData();

        body.append("grant_type", refreshConfig.grantType);
        body.append("refresh_token", refreshConfig.refreshToken);
        body.append("client_id", config.clientId);
        if (config.clientSecret) body.append("client_secret", config.clientSecret);

        try {
            const serviceConfiguration = config.serviceConfiguration;
            const token = await this.fetchToken(serviceConfiguration.tokenEndpoint, body, config);
            return {
                accessToken: token.access_token,
                refreshToken: token.refresh_token,
                tokenType: token.token_type,
                accessTokenExpirationDate: this.getAccessTokenExpirationDate(token.expires_in),
            };
        } catch (error) {
            //If refresh fails, try to reauthorize
            if (config.grantType === "authorization_code") {
                return this.authorizeWithAuthorizationCode(config);
            } else {
                return this.authorizeWithClientCredentials(config);
            }
        }
    };

    static getAccessTokenExpirationDate(expires_in: number | undefined) {
        return Math.min(
            // Add a bit safety threshold to avoid using an expired access token
            Date.now() + (expires_in || 3600) * 0.9 * 1000,
            // Refresh token at minimum once per day
            Date.now() + 24 * 3600 * 1000
        );
    }

    private static getToken(
        authorizationCode: string,
        grantType: oauth.OAuthGrantType,
        config: oauth.IAuthConfiguration | oauth.IAuthWithCredentialsConfiguration,
        verifyer?: string
    ) {
        const serviceConfiguration = config.serviceConfiguration;
        const body = new FormData();

        body.append("grant_type", grantType);
        body.append("code", authorizationCode);
        body.append("client_id", config.clientId);
        if (config.grantType === "authorization_code") body.append("redirect_uri", config.redirectConfiguration.url);
        if (config.scopes) body.append("scope", config.scopes.join("+"));
        if (config.clientSecret) body.append("client_secret", config.clientSecret);
        if (verifyer) body.append("code_verifier", verifyer);

        return this.fetchToken(serviceConfiguration.tokenEndpoint, body, config);
    }

    static async fetchToken(tokenEndpoint: string, data: FormData, config: oauth.IBaseConfiguration) {
        let response: Response;
        if (config.serviceConfiguration.contentType === "x-www-form-urlencoded") {
            response = await fetch(tokenEndpoint, {
                method: "POST",
                body: new URLSearchParams(data as any).toString(),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
        } else {
            response = await fetch(tokenEndpoint, {
                method: "POST",
                body: data,
            });
        }

        if (response.status !== 200) {
            const errorText = await response.text();
            const errorMessage = `${response.status}: ${errorText})}`;
            throw new Error(errorMessage);
        }

        const json = await response.json();
        return json as {
            access_token: string;
            token_type: string;
            expires_in: number;
            refresh_token: string;
        };
    }

    /**
     * Create code challenge for PKCE (Proof Key for Code Exchange).
     * Challenge is sent in initial authorization such that subsequent requests that include the verifyer are validated.
     * Used to prevent malicious attacks by replacing the static secret as it is exposed in the browser.
     */
    static async createChallenge(): Promise<oauth.ICodeChallenge> {
        const allChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        const randomInts = new Uint8Array(50);
        crypto.getRandomValues(randomInts);
        const chars = randomInts.map(function (x) {
            return allChars.charCodeAt(x % allChars.length);
        });
        const verifyer = String.fromCharCode.apply(null, Array.from(chars));

        const digest = await crypto.subtle.digest(this.challengeMethod.algorithm, chars);
        const hash = String.fromCharCode.apply(null, Array.from(new Uint8Array(digest)));
        return { challenge: btoa(hash).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), verifyer: verifyer };
    }
}

export const authorizeWithAuthorizationCode = (config: oauth.IAuthConfiguration) =>
    PapirflyAuthenticator.authorizeWithAuthorizationCode(config);
export const authorizeWithClientCredentials = (config: oauth.IAuthWithCredentialsConfiguration) =>
    PapirflyAuthenticator.authorizeWithClientCredentials(config);
export const refresh = (
    config: oauth.IAuthConfiguration | oauth.IAuthWithCredentialsConfiguration,
    refreshConfig: oauth.IRefreshConfiguration
) => PapirflyAuthenticator.refresh(config, refreshConfig);
