package com.example.auth.application.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;

class JwtTokenServiceTest {
    @Test
    void issuesAccessToken() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();

        JwtTokenService service = new JwtTokenService(
                "auth-service",
                Duration.ofMinutes(10),
                Duration.ofDays(14),
                keyPair);

        String token = service.issueAccessToken("user-123", List.of("ROLE_USER"));
        assertThat(token).isNotBlank();
    }
}
