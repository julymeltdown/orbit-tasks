package com.example.post.adapters.out.grpc;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientInterceptor;
import io.grpc.ForwardingClientCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.grpc.client.GlobalClientInterceptor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@GlobalClientInterceptor
public class JwtClientInterceptor implements ClientInterceptor {
    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);
    private static final String BEARER_PREFIX = "Bearer ";

    private MachineTokenProvider machineTokenProvider;
    private final Supplier<String> requestTokenSupplier;

    public JwtClientInterceptor() {
        this(new MachineTokenProvider(""), JwtClientInterceptor::resolveTokenFromSecurityContext);
    }

    JwtClientInterceptor(MachineTokenProvider machineTokenProvider,
                         Supplier<String> requestTokenSupplier) {
        this.machineTokenProvider = machineTokenProvider;
        this.requestTokenSupplier = requestTokenSupplier;
    }

    @Autowired
    void setMachineTokenProvider(MachineTokenProvider machineTokenProvider) {
        this.machineTokenProvider = machineTokenProvider;
    }

    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(MethodDescriptor<ReqT, RespT> method,
                                                               CallOptions callOptions,
                                                               Channel next) {
        String token = requestTokenSupplier.get();
        if (token == null || token.isBlank()) {
            token = machineTokenProvider.getToken();
        }
        ClientCall<ReqT, RespT> delegate = next.newCall(method, callOptions);
        if (token == null || token.isBlank()) {
            return delegate;
        }
        final String resolvedToken = token;
        return new ForwardingClientCall.SimpleForwardingClientCall<>(delegate) {
            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                headers.put(AUTHORIZATION_KEY, BEARER_PREFIX + resolvedToken);
                super.start(responseListener, headers);
            }
        };
    }

    private static String resolveTokenFromSecurityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            return jwtAuthentication.getToken().getTokenValue();
        }
        Object credentials = authentication == null ? null : authentication.getCredentials();
        return credentials == null ? null : credentials.toString();
    }
}
