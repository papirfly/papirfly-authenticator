import * as sinon from "sinon";
import { OAuth2Utils, OAuth2UtilsTypes } from "../src";
describe("OAuth2Utils", () => {
    const emptyAuthFlowConfig: OAuth2UtilsTypes.IAuthConfiguration = {
        grantType: "authorization_code",
        clientId: "",
        clientSecret: "",

        scopes: [],
        serviceConfiguration: {
            authorizationEndpoint: "",
            tokenEndpoint: "",
        },
        redirectConfiguration: {
            url: "someurl",
            authorizedMessage: "",
            rejectedMessage: "",
        },
    };
    afterEach(() => {
        sinon.restore();
    });

    it("should throw error if popup fails to open", async () => {
        const error = sinon.stub();
        //given
        sinon.stub(window, "open");
        //when
        await OAuth2Utils.authorizeWithAuthorizationCode({ ...emptyAuthFlowConfig, throwError: error });
        //then
        expect(error.callCount).toBe(1);
    });

    it("should throw error if popup unexpectedly closes", async () => {
        const error = sinon.stub();
        //given
        sinon
            .stub(window, "open")
            .returns({ location: { replace: sinon.stub() }, closed: true, close: sinon.stub() } as any);
        //when
        await OAuth2Utils.authorizeWithAuthorizationCode({ ...emptyAuthFlowConfig, throwError: error });
        //then
        expect(error.callCount).toBe(1);
    });

    it("should try to authorize when refresh fails", async () => {
        //given
        sinon.stub(OAuth2Utils, "fetchToken").throws();
        const authorize = sinon.stub(OAuth2Utils, "authorizeWithAuthorizationCode");
        //when
        await OAuth2Utils.refresh(emptyAuthFlowConfig, { refreshToken: "", grantType: "refresh_token" });
        //then
        expect(authorize.callCount).toBe(1);
    });

    it("should try to authorize with credentials when refresh fails", async () => {
        //given
        sinon.stub(OAuth2Utils, "fetchToken").throws();
        const authorize = sinon.stub(OAuth2Utils, "authorizeWithClientCredentials");
        //when
        await OAuth2Utils.refresh(
            {
                grantType: "client_credentials",
                clientId: "",
                clientSecret: "",
                scopes: [],
                serviceConfiguration: {
                    authorizationEndpoint: "",
                    tokenEndpoint: "",
                },
            },
            { refreshToken: "", grantType: "refresh_token" }
        );
        //then
        expect(authorize.callCount).toBe(1);
    });

    it("should create token expiration date", () => {
        //given
        const expiresIn1Hour = 3600;
        //when
        const expirationDate = OAuth2Utils.getAccessTokenExpirationDate(expiresIn1Hour);
        //then
        expect(expirationDate).toBeGreaterThan(Date.now());
    });

    it("should create token expiration date when no expiry date is given", () => {
        //given
        const noExpiry: number | undefined = undefined;
        //when
        const expirationDate = OAuth2Utils.getAccessTokenExpirationDate(noExpiry);
        //then
        expect(expirationDate).toBeGreaterThan(Date.now());
    });

    it("should create random code challenges", async () => {
        //when
        const challenge1 = await OAuth2Utils.createChallenge();
        const challenge2 = await OAuth2Utils.createChallenge();

        expect(challenge1).not.toEqual(challenge2);
    });
});
