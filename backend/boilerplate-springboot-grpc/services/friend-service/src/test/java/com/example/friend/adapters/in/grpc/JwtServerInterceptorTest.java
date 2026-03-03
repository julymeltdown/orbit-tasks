package com.example.friend.adapters.in.grpc;

import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtServerInterceptorTest {
    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

    @Test
    void rejectsMissingBearerToken() {
        JwtServerInterceptor interceptor = new JwtServerInterceptor(token -> validJwt(token), "");
        Metadata headers = new Metadata();

        StatusRuntimeException exception = assertThrows(StatusRuntimeException.class, () ->
                interceptor.interceptCall(mock(ServerCall.class), headers, mock(ServerCallHandler.class)));

        assertEquals(Status.Code.UNAUTHENTICATED, exception.getStatus().getCode());
        assertEquals("Missing bearer token", exception.getStatus().getDescription());
    }

    @Test
    void rejectsBlankBearerToken() {
        JwtServerInterceptor interceptor = new JwtServerInterceptor(token -> validJwt(token), "");
        Metadata headers = new Metadata();
        headers.put(AUTHORIZATION_KEY, "Bearer   ");

        StatusRuntimeException exception = assertThrows(StatusRuntimeException.class, () ->
                interceptor.interceptCall(mock(ServerCall.class), headers, mock(ServerCallHandler.class)));

        assertEquals(Status.Code.UNAUTHENTICATED, exception.getStatus().getCode());
        assertEquals("Missing bearer token", exception.getStatus().getDescription());
    }

    @Test
    void rejectsInvalidBearerToken() {
        JwtDecoder decoder = token -> {
            throw new JwtException("bad-token");
        };
        JwtServerInterceptor interceptor = new JwtServerInterceptor(decoder, "");
        Metadata headers = new Metadata();
        headers.put(AUTHORIZATION_KEY, "Bearer invalid");

        StatusRuntimeException exception = assertThrows(StatusRuntimeException.class, () ->
                interceptor.interceptCall(mock(ServerCall.class), headers, mock(ServerCallHandler.class)));

        assertEquals(Status.Code.UNAUTHENTICATED, exception.getStatus().getCode());
        assertEquals("Invalid bearer token", exception.getStatus().getDescription());
        assertNotNull(exception.getCause());
    }

    @Test
    @SuppressWarnings("unchecked")
    void acceptsValidBearerToken() {
        AtomicBoolean decoded = new AtomicBoolean(false);
        JwtServerInterceptor interceptor = new JwtServerInterceptor(token -> {
            decoded.set(true);
            return validJwt(token);
        }, "");

        Metadata headers = new Metadata();
        headers.put(AUTHORIZATION_KEY, "Bearer valid-token");

        ServerCall<Object, Object> call = mock(ServerCall.class);
        ServerCallHandler<Object, Object> next = mock(ServerCallHandler.class);
        ServerCall.Listener<Object> listener = new ServerCall.Listener<>() {
        };
        when(next.startCall(call, headers)).thenReturn(listener);

        ServerCall.Listener<Object> actual = interceptor.interceptCall(call, headers, next);

        assertTrue(decoded.get());
        assertSame(listener, actual);
        verify(next).startCall(call, headers);
    }

    @Test
    @SuppressWarnings("unchecked")
    void acceptsConfiguredInternalServiceTokenWithoutJwtDecoding() {
        JwtDecoder decoder = mock(JwtDecoder.class);
        JwtServerInterceptor interceptor = new JwtServerInterceptor(decoder, "internal-token");

        Metadata headers = new Metadata();
        headers.put(AUTHORIZATION_KEY, "Bearer internal-token");

        ServerCall<Object, Object> call = mock(ServerCall.class);
        ServerCallHandler<Object, Object> next = mock(ServerCallHandler.class);
        ServerCall.Listener<Object> listener = new ServerCall.Listener<>() {
        };
        when(next.startCall(call, headers)).thenReturn(listener);

        ServerCall.Listener<Object> actual = interceptor.interceptCall(call, headers, next);

        assertSame(listener, actual);
        verify(next).startCall(call, headers);
    }

    private static Jwt validJwt(String token) {
        Instant now = Instant.now();
        return Jwt.withTokenValue(token)
                .header("alg", "none")
                .claim("sub", "friend-test")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(60))
                .build();
    }
}
