package com.example.friend.adapters.in.grpc;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientInterceptor;
import io.grpc.ForwardingClientCall;
import io.grpc.ForwardingServerCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.grpc.client.GlobalClientInterceptor;
import org.springframework.grpc.server.GlobalServerInterceptor;
import org.springframework.stereotype.Component;

@Component
@GlobalServerInterceptor
@GlobalClientInterceptor
public class GrpcCorrelationInterceptor implements ServerInterceptor, ClientInterceptor {
    private static final Metadata.Key<String> CORRELATION_ID_HEADER =
            Metadata.Key.of("x-correlation-id", Metadata.ASCII_STRING_MARSHALLER);
    private static final String MDC_KEY = "correlationId";

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(ServerCall<ReqT, RespT> call,
                                                                 Metadata headers,
                                                                 ServerCallHandler<ReqT, RespT> next) {
        String correlationId = headers.get(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        MDC.put(MDC_KEY, correlationId);
        String finalCorrelationId = correlationId;
        ServerCall<ReqT, RespT> forwardingCall = new ForwardingServerCall.SimpleForwardingServerCall<>(call) {
            @Override
            public void sendHeaders(Metadata responseHeaders) {
                if (responseHeaders.get(CORRELATION_ID_HEADER) == null) {
                    responseHeaders.put(CORRELATION_ID_HEADER, finalCorrelationId);
                }
                super.sendHeaders(responseHeaders);
            }
        };
        ServerCall.Listener<ReqT> listener = next.startCall(forwardingCall, headers);
        return new ForwardingServerCallListener<>(listener, correlationId);
    }

    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(MethodDescriptor<ReqT, RespT> method,
                                                               CallOptions callOptions,
                                                               Channel next) {
        String correlationId = MDC.get(MDC_KEY);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        ClientCall<ReqT, RespT> delegate = next.newCall(method, callOptions);
        String finalCorrelationId = correlationId;
        return new ForwardingClientCall.SimpleForwardingClientCall<>(delegate) {
            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                if (headers.get(CORRELATION_ID_HEADER) == null) {
                    headers.put(CORRELATION_ID_HEADER, finalCorrelationId);
                }
                super.start(responseListener, headers);
            }
        };
    }

    private static class ForwardingServerCallListener<ReqT>
            extends io.grpc.ForwardingServerCallListener.SimpleForwardingServerCallListener<ReqT> {
        private final String correlationId;

        ForwardingServerCallListener(ServerCall.Listener<ReqT> delegate, String correlationId) {
            super(delegate);
            this.correlationId = correlationId;
        }

        @Override
        public void onComplete() {
            MDC.remove(MDC_KEY);
            super.onComplete();
        }

        @Override
        public void onCancel() {
            MDC.remove(MDC_KEY);
            super.onCancel();
        }
    }
}
