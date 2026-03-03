package com.example.profile.adapters.in.grpc;

import com.example.profile.v1.GetProfileRequest;
import com.example.profile.v1.ProfileServiceGrpc;
import io.grpc.Metadata;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.MetadataUtils;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.grpc.test.autoconfigure.AutoConfigureInProcessTransport;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@AutoConfigureInProcessTransport
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.grpc.client.channels.local.address=localhost:9090")
class ProfileGrpcAuthTest {
    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

    @Autowired
    private ProfileServiceGrpc.ProfileServiceBlockingStub stub;

    @Test
    void rejectsMissingToken() {
        GetProfileRequest request = GetProfileRequest.newBuilder()
                .setUserId("user-1")
                .build();
        StatusRuntimeException ex = assertThrows(StatusRuntimeException.class, () -> stub.getProfile(request));
        assertEquals(Status.Code.UNAUTHENTICATED, ex.getStatus().getCode());
    }

    @Test
    void acceptsValidToken() {
        Metadata headers = new Metadata();
        headers.put(AUTHORIZATION_KEY, "Bearer valid-token");
        ProfileServiceGrpc.ProfileServiceBlockingStub authStub =
                stub.withInterceptors(MetadataUtils.newAttachHeadersInterceptor(headers));

        GetProfileRequest request = GetProfileRequest.newBuilder()
                .setUserId("user-1")
                .build();
        assertEquals("user-1", authStub.getProfile(request).getProfile().getUserId());
    }

    @TestConfiguration
    static class GrpcTestConfig {
        @Bean
        @Primary
        JwtDecoder jwtDecoder() {
            return token -> {
                if (!"valid-token".equals(token)) {
                    throw new JwtException("Invalid token");
                }
                Instant now = Instant.now();
                return Jwt.withTokenValue(token)
                        .header("alg", "none")
                        .claim("sub", "user-1")
                        .issuedAt(now)
                        .expiresAt(now.plusSeconds(60))
                        .build();
            };
        }
    }
}
