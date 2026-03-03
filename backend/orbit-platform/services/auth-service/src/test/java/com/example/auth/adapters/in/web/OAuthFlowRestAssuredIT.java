package com.example.auth.adapters.in.web;

import com.example.auth.adapters.in.web.dto.OAuthLinkRequest;
import com.example.auth.application.port.out.OAuthClientPort;
import com.example.auth.application.port.out.OAuthUserInfo;
import com.example.auth.domain.IdentityProvider;
import io.restassured.RestAssured;
import java.util.Map;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import com.example.auth.TestStubsConfig;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestStubsConfig.class)
class OAuthFlowRestAssuredIT {
    @LocalServerPort
    private int port;

    @BeforeEach
    void setup() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
    }

    @Test
    void oauthCallbackAndLinkFlow() {
        String accessToken = RestAssured.given()
                .queryParam("code", "code")
                .queryParam("state", "state")
                .when()
                .get("/auth/oauth/GOOGLE/callback")
                .then()
                .log().ifValidationFails()
                .statusCode(200)
                .body("accessToken", Matchers.not(Matchers.emptyOrNullString()))
                .extract()
                .path("accessToken");

        RestAssured.given()
                .queryParam("access_token", accessToken)
                .contentType("application/json")
                .body(new OAuthLinkRequest("code", "state"))
                .when()
                .post("/auth/oauth/APPLE/link")
                .then()
                .log().ifValidationFails()
                .statusCode(200)
                .body("linkedProviders", Matchers.hasItems("GOOGLE", "APPLE"));
    }

    @TestConfiguration
    static class StubConfig {
        @Bean
        @Primary
        OAuthClientPort oauthClientPort() {
            return new OAuthClientPort() {
                @Override
                public OAuthUserInfo fetchUserInfo(IdentityProvider provider, String code, String redirectUri) {
                    return switch (provider) {
                        case GOOGLE -> new OAuthUserInfo(
                                IdentityProvider.GOOGLE,
                                "google-sub",
                                "user@example.com",
                                true,
                                Map.of("sub", "google-sub", "email", "user@example.com", "email_verified", true));
                        case APPLE -> new OAuthUserInfo(
                                IdentityProvider.APPLE,
                                "apple-sub",
                                "user@example.com",
                                true,
                                Map.of("sub", "apple-sub", "email", "user@example.com", "email_verified", true));
                        default -> throw new IllegalArgumentException("Unsupported provider");
                    };
                }

                @Override
                public String buildAuthorizationUri(IdentityProvider provider, String redirectUri, String state) {
                    return "https://example.com/oauth?state=" + state;
                }
            };
        }
    }
}
