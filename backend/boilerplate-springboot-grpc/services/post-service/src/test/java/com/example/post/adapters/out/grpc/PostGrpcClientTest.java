package com.example.post.adapters.out.grpc;

import com.example.friend.v1.FriendServiceGrpc;
import com.example.friend.v1.ListFollowingRequest;
import com.example.friend.v1.ListFollowingResponse;
import io.grpc.BindableService;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.stub.StreamObserver;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Bean;
import org.springframework.grpc.server.GlobalServerInterceptor;
import org.springframework.boot.grpc.test.autoconfigure.AutoConfigureInProcessTransport;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@AutoConfigureInProcessTransport
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.grpc.client.channels.friend.address=localhost:9090",
        "post.security.internal.service-token=internal-service-token"
})
class PostGrpcClientTest {
    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

    @Autowired
    private FriendServiceGrpc.FriendServiceBlockingStub friendStub;

    @Autowired
    private CapturingServerInterceptor capturingServerInterceptor;

    @BeforeEach
    void setUpSecurityContext() {
        Instant now = Instant.now();
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .claim("sub", "user-1")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(300))
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void attachesAuthorizationHeader() {
        ListFollowingRequest request = ListFollowingRequest.newBuilder()
                .setUserId("user-1")
                .build();
        friendStub.listFollowing(request);
        assertEquals("Bearer test-token", capturingServerInterceptor.getAuthorizationHeader());
    }

    @Test
    void fallsBackToInternalServiceTokenWhenSecurityContextMissing() {
        SecurityContextHolder.clearContext();
        ListFollowingRequest request = ListFollowingRequest.newBuilder()
                .setUserId("user-1")
                .build();
        friendStub.listFollowing(request);
        assertEquals("Bearer internal-service-token", capturingServerInterceptor.getAuthorizationHeader());
    }

    @TestConfiguration
    static class GrpcTestConfig {
        @Bean
        @Primary
        JwtDecoder jwtDecoder() {
            return token -> {
                if (!"test-token".equals(token) && !"internal-service-token".equals(token)) {
                    throw new JwtException("Invalid token");
                }
                Instant now = Instant.now();
                return Jwt.withTokenValue(token)
                        .header("alg", "none")
                        .claim("sub", "user-1")
                        .issuedAt(now)
                        .expiresAt(now.plusSeconds(300))
                        .build();
            };
        }

        @Bean
        @GlobalServerInterceptor
        CapturingServerInterceptor capturingServerInterceptor() {
            return new CapturingServerInterceptor();
        }

        @Bean
        BindableService friendGrpcService() {
            return new FriendServiceGrpc.FriendServiceImplBase() {
                @Override
                public void listFollowing(ListFollowingRequest request,
                                          StreamObserver<ListFollowingResponse> responseObserver) {
                    responseObserver.onNext(ListFollowingResponse.newBuilder().build());
                    responseObserver.onCompleted();
                }
            };
        }
    }

    static class CapturingServerInterceptor implements ServerInterceptor {
        private final AtomicReference<String> authorizationHeader = new AtomicReference<>();

        @Override
        public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(ServerCall<ReqT, RespT> call,
                                                                     Metadata headers,
                                                                     ServerCallHandler<ReqT, RespT> next) {
            authorizationHeader.set(headers.get(AUTHORIZATION_KEY));
            return next.startCall(call, headers);
        }

        String getAuthorizationHeader() {
            return authorizationHeader.get();
        }
    }
}
