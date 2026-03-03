package com.example.friend.adapters.in.grpc;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.Status;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GrpcCorrelationInterceptorTest {
    private static final Metadata.Key<String> CORRELATION_ID_HEADER =
            Metadata.Key.of("x-correlation-id", Metadata.ASCII_STRING_MARSHALLER);

    @AfterEach
    void cleanMdc() {
        MDC.remove("correlationId");
    }

    @Test
    @SuppressWarnings("unchecked")
    void serverInterceptorAddsCorrelationHeaderWhenMissing() {
        GrpcCorrelationInterceptor interceptor = new GrpcCorrelationInterceptor();
        Metadata headers = new Metadata();

        ServerCall<String, String> call = mock(ServerCall.class);
        ServerCallHandler<String, String> next = mock(ServerCallHandler.class);
        ServerCall.Listener<String> delegate = new ServerCall.Listener<>() {
        };
        when(next.startCall(any(ServerCall.class), eq(headers))).thenReturn(delegate);

        ServerCall.Listener<String> listener = interceptor.interceptCall(call, headers, next);

        verify(next).startCall(any(ServerCall.class), eq(headers));
        assertNotNull(listener);
        assertNotNull(MDC.get("correlationId"));

        Metadata responseHeaders = new Metadata();
        listener.onComplete();
        assertNull(MDC.get("correlationId"));

        // drive forwarding sendHeaders branch by re-running and invoking captured call
        when(next.startCall(any(ServerCall.class), eq(headers))).thenAnswer(invocation -> {
            ServerCall<String, String> forwardingCall = invocation.getArgument(0);
            forwardingCall.sendHeaders(responseHeaders);
            return delegate;
        });
        interceptor.interceptCall(call, headers, next);
        assertNotNull(responseHeaders.get(CORRELATION_ID_HEADER));
    }

    @Test
    @SuppressWarnings("unchecked")
    void serverInterceptorPreservesExistingHeaderAndCleansOnCancel() {
        GrpcCorrelationInterceptor interceptor = new GrpcCorrelationInterceptor();
        Metadata headers = new Metadata();
        headers.put(CORRELATION_ID_HEADER, "req-correlation");

        ServerCall<String, String> call = mock(ServerCall.class);
        ServerCallHandler<String, String> next = mock(ServerCallHandler.class);
        ServerCall.Listener<String> delegate = new ServerCall.Listener<>() {
        };

        Metadata responseHeaders = new Metadata();
        responseHeaders.put(CORRELATION_ID_HEADER, "already-set");
        when(next.startCall(any(ServerCall.class), eq(headers))).thenAnswer(invocation -> {
            ServerCall<String, String> forwardingCall = invocation.getArgument(0);
            forwardingCall.sendHeaders(responseHeaders);
            return delegate;
        });

        ServerCall.Listener<String> listener = interceptor.interceptCall(call, headers, next);
        assertEquals("already-set", responseHeaders.get(CORRELATION_ID_HEADER));
        assertEquals("req-correlation", MDC.get("correlationId"));

        listener.onCancel();
        assertNull(MDC.get("correlationId"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void clientInterceptorPropagatesMdcCorrelationId() {
        GrpcCorrelationInterceptor interceptor = new GrpcCorrelationInterceptor();
        MDC.put("correlationId", "mdc-correlation");

        MethodDescriptor<String, String> method = methodDescriptor("friend/test");
        Channel next = mock(Channel.class);
        ClientCall<String, String> delegate = mock(ClientCall.class);
        when(next.newCall(method, CallOptions.DEFAULT)).thenReturn(delegate);

        ClientCall<String, String> intercepted = interceptor.interceptCall(method, CallOptions.DEFAULT, next);
        Metadata headers = new Metadata();
        ClientCall.Listener<String> responseListener = new ClientCall.Listener<>() {
        };
        intercepted.start(responseListener, headers);

        verify(delegate).start(responseListener, headers);
        assertEquals("mdc-correlation", headers.get(CORRELATION_ID_HEADER));
    }

    @Test
    @SuppressWarnings("unchecked")
    void clientInterceptorGeneratesCorrelationIdWhenMdcMissing() {
        GrpcCorrelationInterceptor interceptor = new GrpcCorrelationInterceptor();

        MethodDescriptor<String, String> method = methodDescriptor("friend/test-2");
        Channel next = mock(Channel.class);
        ClientCall<String, String> delegate = mock(ClientCall.class);
        when(next.newCall(method, CallOptions.DEFAULT)).thenReturn(delegate);

        ClientCall<String, String> intercepted = interceptor.interceptCall(method, CallOptions.DEFAULT, next);
        Metadata headers = new Metadata();
        ClientCall.Listener<String> responseListener = new ClientCall.Listener<>() {
        };
        intercepted.start(responseListener, headers);

        String correlationId = headers.get(CORRELATION_ID_HEADER);
        assertNotNull(correlationId);
        assertTrue(!correlationId.isBlank());
    }

    private static MethodDescriptor<String, String> methodDescriptor(String fullMethodName) {
        MethodDescriptor.Marshaller<String> marshaller = new MethodDescriptor.Marshaller<>() {
            @Override
            public InputStream stream(String value) {
                return new ByteArrayInputStream(value.getBytes(StandardCharsets.UTF_8));
            }

            @Override
            public String parse(InputStream stream) {
                try {
                    return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
                } catch (Exception ex) {
                    throw Status.INTERNAL.withDescription("marshal parse failure")
                            .withCause(ex)
                            .asRuntimeException();
                }
            }
        };
        return MethodDescriptor.<String, String>newBuilder()
                .setType(MethodDescriptor.MethodType.UNARY)
                .setFullMethodName(fullMethodName)
                .setRequestMarshaller(marshaller)
                .setResponseMarshaller(marshaller)
                .build();
    }
}
