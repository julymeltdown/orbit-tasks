package com.orbit.eventkit.security;

import io.grpc.ForwardingServerCallListener;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.Status;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class WorkspaceAuthorizationInterceptor implements ServerInterceptor {
    public static final Metadata.Key<String> WORKSPACE_HEADER =
            Metadata.Key.of("x-workspace-id", Metadata.ASCII_STRING_MARSHALLER);

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {
        String workspaceId = headers.get(WORKSPACE_HEADER);
        if (workspaceId == null || workspaceId.isBlank()) {
            call.close(Status.PERMISSION_DENIED.withDescription("Missing workspace scope."), new Metadata());
            return new ServerCall.Listener<>() {
            };
        }

        try {
            UUID.fromString(workspaceId);
        } catch (IllegalArgumentException ex) {
            call.close(Status.PERMISSION_DENIED.withDescription("Invalid workspace scope."), new Metadata());
            return new ServerCall.Listener<>() {
            };
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            call.close(Status.UNAUTHENTICATED.withDescription("Authentication required."), new Metadata());
            return new ServerCall.Listener<>() {
            };
        }

        return new ForwardingServerCallListener.SimpleForwardingServerCallListener<>(next.startCall(call, headers)) {
        };
    }
}
