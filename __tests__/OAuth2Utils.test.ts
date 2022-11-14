import * as sinon from "sinon";
import { PapirflyAuthenticator, PapirflyAuthenticatorInterfaces } from "../src";
describe("PapirflyAuthenticator", () => {
    const emptyAuthFlowConfig: PapirflyAuthenticatorInterfaces.IAuthConfiguration = {
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
        await PapirflyAuthenticator.authorizeWithAuthorizationCode({ ...emptyAuthFlowConfig, throwError: error });
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
        await PapirflyAuthenticator.authorizeWithAuthorizationCode({ ...emptyAuthFlowConfig, throwError: error });
        //then
        expect(error.callCount).toBe(1);
    });

    it("should try to authorize when refresh fails", async () => {
        //given
        sinon.stub(PapirflyAuthenticator, "fetchToken").throws();
        const authorize = sinon.stub(PapirflyAuthenticator, "authorizeWithAuthorizationCode");
        //when
        await PapirflyAuthenticator.refresh(emptyAuthFlowConfig, { refreshToken: "", grantType: "refresh_token" });
        //then
        expect(authorize.callCount).toBe(1);
    });

    it("should try to authorize with credentials when refresh fails", async () => {
        //given
        sinon.stub(PapirflyAuthenticator, "fetchToken").throws();
        const authorize = sinon.stub(PapirflyAuthenticator, "authorizeWithClientCredentials");
        //when
        await PapirflyAuthenticator.refresh(
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
        const expirationDate = PapirflyAuthenticator.getAccessTokenExpirationDate(expiresIn1Hour);
        //then
        expect(expirationDate).toBeGreaterThan(Date.now());
    });

    it("should create token expiration date when no expiry date is given", () => {
        //given
        const noExpiry: number | undefined = undefined;
        //when
        const expirationDate = PapirflyAuthenticator.getAccessTokenExpirationDate(noExpiry);
        //then
        expect(expirationDate).toBeGreaterThan(Date.now());
    });

    it("should create random code challenges", async () => {
        //when
        const challenge1 = await PapirflyAuthenticator.createChallenge();
        const challenge2 = await PapirflyAuthenticator.createChallenge();

        expect(challenge1).not.toEqual(challenge2);
    });
});
