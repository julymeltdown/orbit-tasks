package com.example.profile.adapters.in.grpc;

import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.Status;
import java.util.Objects;
import org.springframework.grpc.server.GlobalServerInterceptor;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

@Component
@GlobalServerInterceptor
public class JwtServerInterceptor implements ServerInterceptor {
    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtDecoder jwtDecoder;

    public JwtServerInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(ServerCall<ReqT, RespT> call,
                                                                 Metadata headers,
                                                                 ServerCallHandler<ReqT, RespT> next) {
        String authorization = headers.get(AUTHORIZATION_KEY);
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            throw Status.UNAUTHENTICATED.withDescription("Missing bearer token").asRuntimeException();
        }
        String token = authorization.substring(BEARER_PREFIX.length());
        if (token.isBlank()) {
            throw Status.UNAUTHENTICATED.withDescription("Missing bearer token").asRuntimeException();
        }
        try {
            jwtDecoder.decode(Objects.toString(token, ""));
        } catch (JwtException ex) {
            throw Status.UNAUTHENTICATED.withDescription("Invalid bearer token")
                    .withCause(ex)
                    .asRuntimeException();
        }
        return next.startCall(call, headers);
    }
}
