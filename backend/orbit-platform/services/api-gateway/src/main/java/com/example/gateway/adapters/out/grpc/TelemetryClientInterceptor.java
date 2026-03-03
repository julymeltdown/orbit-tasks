package com.example.gateway.adapters.out.grpc;

import com.example.gateway.application.service.TelemetryService;
import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientInterceptor;
import io.grpc.ForwardingClientCall;
import io.grpc.ForwardingClientCallListener;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.grpc.Status;
import org.springframework.grpc.client.GlobalClientInterceptor;
import org.springframework.stereotype.Component;

@Component
@GlobalClientInterceptor
public class TelemetryClientInterceptor implements ClientInterceptor {
    private final TelemetryService telemetryService;

    public TelemetryClientInterceptor(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
            MethodDescriptor<ReqT, RespT> method,
            CallOptions callOptions,
            Channel next) {
        long start = System.nanoTime();
        ClientCall<ReqT, RespT> delegate = next.newCall(method, callOptions);
        return new ForwardingClientCall.SimpleForwardingClientCall<>(delegate) {
            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                Listener<RespT> wrapped = new ForwardingClientCallListener.SimpleForwardingClientCallListener<>(responseListener) {
                    @Override
                    public void onClose(Status status, Metadata trailers) {
                        long latencyMs = (System.nanoTime() - start) / 1_000_000;
                        telemetryService.recordDownstreamLatency(
                                method.getFullMethodName(),
                                latencyMs,
                                status.isOk());
                        super.onClose(status, trailers);
                    }
                };
                super.start(wrapped, headers);
            }
        };
    }
}
