package com.example.auth.adapters.out.oauth;

import com.example.auth.application.port.out.OAuthUserInfo;
import com.example.auth.domain.IdentityProvider;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Map;
import net.minidev.json.JSONObject;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

class OAuthClientServiceTest {
    private MockWebServer server;
    private OAuthClientService oauthClientService;
    private ClientRegistrationRepository repository;

    @BeforeEach
    void setUp() throws Exception {
        server = new MockWebServer();
        server.start();

        String baseUrl = server.url("/").toString();
        ClientRegistration google = ClientRegistration.withRegistrationId("google")
                .clientId("client")
                .clientSecret("secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost/auth/oauth/google/callback")
                .scope("openid", "profile", "email")
                .authorizationUri(baseUrl + "google/authorize")
                .tokenUri(baseUrl + "google/token")
                .userInfoUri(baseUrl + "google/userinfo")
                .userNameAttributeName("sub")
                .build();

        ClientRegistration apple = ClientRegistration.withRegistrationId("apple")
                .clientId("client")
                .clientSecret("secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost/auth/oauth/apple/callback")
                .scope("name", "email")
                .authorizationUri(baseUrl + "apple/authorize")
                .tokenUri(baseUrl + "apple/token")
                // no userInfoUri to force id_token claim extraction
                .jwkSetUri(baseUrl + "apple/keys")
                .userNameAttributeName("sub")
                .build();

        repository = new InMemoryClientRegistrationRepository(google, apple);
        oauthClientService = new OAuthClientService(repository, RestClient.builder().build(), new OAuthUserInfoMapper());
    }

    @AfterEach
    void tearDown() throws Exception {
        server.shutdown();
    }

    @Test
    void googleFetchUserInfoExchangesCodeThenCallsUserInfoEndpoint() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json")
                .setBody("{\"access_token\":\"access-1\"}"));
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json")
                .setBody("{\"sub\":\"google-sub\",\"email\":\"user@example.com\",\"email_verified\":true}"));

        OAuthUserInfo userInfo = oauthClientService.fetchUserInfo(
                IdentityProvider.GOOGLE,
                "code",
                "http://localhost/auth/oauth/google/callback");

        assertThat(userInfo.provider()).isEqualTo(IdentityProvider.GOOGLE);
        assertThat(userInfo.subject()).isEqualTo("google-sub");
        assertThat(userInfo.email()).isEqualTo("user@example.com");
        assertThat(userInfo.emailVerified()).isTrue();

        RecordedRequest tokenRequest = server.takeRequest();
        assertThat(tokenRequest.getMethod()).isEqualTo("POST");
        assertThat(tokenRequest.getPath()).isEqualTo("/google/token");
        assertThat(tokenRequest.getBody().readUtf8()).contains("grant_type=authorization_code");

        RecordedRequest userInfoRequest = server.takeRequest();
        assertThat(userInfoRequest.getMethod()).isEqualTo("GET");
        assertThat(userInfoRequest.getPath()).isEqualTo("/google/userinfo");
        assertThat(userInfoRequest.getHeader("Authorization")).isEqualTo("Bearer access-1");
    }

    @Test
    void appleFetchUserInfoExtractsClaimsFromIdToken() throws Exception {
        RSAKey rsaKey = new RSAKeyGenerator(2048).keyID("kid-1").generate();
        String idToken = signJwt(rsaKey, Map.of(
                "sub", "apple-sub",
                "email", "user@example.com",
                "email_verified", true));

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json")
                .setBody("{\"id_token\":\"" + idToken + "\"}"));

        String jwkSetJson = JSONObject.toJSONString(new JWKSet(rsaKey.toPublicJWK()).toJSONObject());
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json")
                .setBody(jwkSetJson));

        OAuthUserInfo userInfo = oauthClientService.fetchUserInfo(
                IdentityProvider.APPLE,
                "code",
                "http://localhost/auth/oauth/apple/callback");

        assertThat(userInfo.provider()).isEqualTo(IdentityProvider.APPLE);
        assertThat(userInfo.subject()).isEqualTo("apple-sub");
        assertThat(userInfo.email()).isEqualTo("user@example.com");
        assertThat(userInfo.emailVerified()).isTrue();

        RecordedRequest tokenRequest = server.takeRequest();
        assertThat(tokenRequest.getMethod()).isEqualTo("POST");
        assertThat(tokenRequest.getPath()).isEqualTo("/apple/token");

        RecordedRequest keyRequest = server.takeRequest();
        assertThat(keyRequest.getMethod()).isEqualTo("GET");
        assertThat(keyRequest.getPath()).isEqualTo("/apple/keys");
    }

    @Test
    void buildAuthorizationUriIncludesStateAndRedirect() {
        String uri = oauthClientService.buildAuthorizationUri(
                IdentityProvider.GOOGLE,
                "http://localhost/auth/oauth/google/callback",
                "state-123");

        assertThat(uri).contains("state=state-123");
        assertThat(uri).contains("redirect_uri=http");
        assertThat(uri).contains("client_id=client");
    }

    private static String signJwt(RSAKey rsaKey, Map<String, Object> claims) throws Exception {
        Instant now = Instant.now();
        JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder()
                .issuer("issuer")
                .issueTime(java.util.Date.from(now))
                .expirationTime(java.util.Date.from(now.plusSeconds(3600)));
        claims.forEach(builder::claim);
        JWTClaimsSet claimSet = builder.build();

        SignedJWT signed = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(rsaKey.getKeyID()).build(),
                claimSet);
        signed.sign(new RSASSASigner(rsaKey.toPrivateKey()));
        return signed.serialize();
    }
}
