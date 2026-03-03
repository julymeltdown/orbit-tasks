package com.example.auth.adapters.in.web;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import com.example.auth.TestStubsConfig;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestStubsConfig.class)
class AuthFlowRestAssuredIT {
    @LocalServerPort
    private int port;

    @BeforeEach
    void setup() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
    }

    @Test
    void signupVerifyLoginFlow() {
        // TODO: implement once endpoints exist
        RestAssured.given()
                .when()
                .get("/actuator/health")
                .then()
                .statusCode(200);
    }
}
