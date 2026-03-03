package com.example.auth.adapters.in.web;

import com.example.auth.application.port.out.EmailSenderPort;
import io.restassured.RestAssured;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthEmailFlowTestcontainersIT {
    @Container
    private static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:16-alpine"))
            .withDatabaseName("auth_test")
            .withUsername("auth_test")
            .withPassword("auth_test");

    @Container
    private static final GenericContainer<?> redis = new GenericContainer<>(
            DockerImageName.parse("redis:7.2.4"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        // Avoid shutdown ordering issues where the container stops before Hibernate drops schema.
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");

        registry.add("spring.data.redis.url",
                () -> "redis://" + redis.getHost() + ":" + redis.getMappedPort(6379));

        // Avoid port conflicts on shared environments.
        registry.add("spring.grpc.server.port", () -> "0");
        registry.add("management.health.mail.enabled", () -> "false");
        registry.add("management.health.redis.enabled", () -> "false");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private CapturingEmailSender emailSenderPort;

    @BeforeEach
    void setup() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
        emailSenderPort.reset();
    }

    @Test
    void emailSignupVerifyLoginRefreshLogoutAndPasswordResetFlow() {
        String email = "tc-user@example.com";
        String password = "Password123!";

        RestAssured.given()
                .contentType("application/json")
                .body(Map.of("email", email))
                .when()
                .post("/auth/email/check")
                .then()
                .statusCode(200)
                .body("email", Matchers.equalTo(email))
                .body("available", Matchers.equalTo(true))
                .body("status", Matchers.equalTo("AVAILABLE"));

        String userId = RestAssured.given()
                .contentType("application/json")
                .body(Map.of("email", email, "password", password))
                .when()
                .post("/auth/email/signup")
                .then()
                .log().ifValidationFails()
                .statusCode(200)
                .body("status", Matchers.equalTo("PENDING_VERIFICATION"))
                .extract()
                .path("userId");

        String code = emailSenderPort.lastVerificationCode();
        org.junit.jupiter.api.Assertions.assertNotNull(code, "Expected verification code to be captured");

        RestAssured.given()
                .contentType("application/json")
                .body(Map.of("email", email, "code", "000000"))
                .when()
                .post("/auth/email/verify")
                .then()
                .statusCode(400)
                .body("code", Matchers.equalTo("BAD_REQUEST"));

        RestAssured.given()
                .contentType("application/json")
                .body(Map.of("email", email, "code", code))
                .when()
                .post("/auth/email/verify")
                .then()
                .log().ifValidationFails()
                .statusCode(200)
                .body("userId", Matchers.equalTo(userId))
                .body("status", Matchers.equalTo("VERIFIED"));

        RestAssured.given()
                .contentType("application/json")
                .body(Map.of("email", email, "password", "wrong-password"))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(400)
                .body("code", Matchers.equalTo("BAD_REQUEST"))
                .body("message", Matchers.containsStringIgnoringCase("credentials"));

        String refreshToken = RestAssured.given()
                .contentType("application/json")
                .body(Map.of("email", email, "password", password))
                .when()
                .post("/auth/login")
                .then()
                .log().ifValidationFails()
                .statusCode(200)
                .body("userId", Matchers.equalTo(userId))
                .body("tokenType", Matchers.equalTo("Bearer"))
                .body("accessToken", Matchers.not(Matchers.emptyOrNullString()))
                .body("refreshToken", Matchers.not(Matchers.emptyOrNullString()))
                .body("linkedProviders", Matchers.hasItem("EMAIL"))
                .extract()
                .path("refreshToken");

        String rotatedRefreshToken = RestAssured.given()
                .contentType("application/json")
                .body(Map.of("refreshToken", refreshToken))
                .when()
                .post("/auth/refresh")
                .then()
                .log().ifValidationFails()
                .statusCode(200)
                .body("refreshToken", Matchers.not(Matchers.equalTo(refreshToken)))
                .extract()
                .path("refreshToken");

        RestAssured.given()
                .contentType("application/json")
                .body(Map.of("refreshToken", rotatedRefreshToken))
                .when()
                .post("/auth/logout")
                .then()
                .statusCode(200);

        RestAssured.given()
                .contentType("application/json")
                .body(Map.of("refreshToken", rotatedRefreshToken))
                .when()
                .post("/auth/refresh")
                .then()
                .statusCode(400)
                .body("code", Matchers.equalTo("BAD_REQUEST"));

        RestAssured.given()
                .contentType("application/json")
                .body(Map.of("email", email))
                .when()
                .post("/auth/password/reset/request")
                .then()
                .log().ifValidationFails()
                .statusCode(200)
                .body("status", Matchers.equalTo("SENT"));

        String resetToken = extractToken(emailSenderPort.lastPasswordResetLink());

        RestAssured.given()
                .contentType("application/json")
                .body(Map.of("token", resetToken, "newPassword", "NewPassword123!"))
                .when()
                .post("/auth/password/reset/confirm")
                .then()
                .log().ifValidationFails()
                .statusCode(200)
                .body("status", Matchers.equalTo("RESET"));

        RestAssured.given()
                .contentType("application/json")
                .body(Map.of("email", email, "password", "NewPassword123!"))
                .when()
                .post("/auth/login")
                .then()
                .log().ifValidationFails()
                .statusCode(200)
                .body("userId", Matchers.equalTo(userId));
    }

    private static String extractToken(String link) {
        org.junit.jupiter.api.Assertions.assertNotNull(link, "Expected password reset link to be captured");
        URI uri = URI.create(link);
        String query = uri.getQuery();
        org.junit.jupiter.api.Assertions.assertNotNull(query, "Missing reset token query string");
        for (String pair : query.split("&")) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 2 && "token".equals(parts[0])) {
                return URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
            }
        }
        throw new IllegalArgumentException("Missing token parameter");
    }

    static final class CapturingEmailSender implements EmailSenderPort {
        private volatile String verificationCode;
        private volatile String passwordResetLink;

        @Override
        public void sendVerificationCode(String email, String code) {
            this.verificationCode = code;
        }

        @Override
        public void sendPasswordResetLink(String email, String link) {
            this.passwordResetLink = link;
        }

        void reset() {
            this.verificationCode = null;
            this.passwordResetLink = null;
        }

        String lastVerificationCode() {
            return verificationCode;
        }

        String lastPasswordResetLink() {
            return passwordResetLink;
        }
    }

    @TestConfiguration
    static class StubConfig {
        @Bean
        @Primary
        CapturingEmailSender emailSenderPort() {
            return new CapturingEmailSender();
        }
    }
}
