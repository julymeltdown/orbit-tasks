package com.example.post.adapters.out.grpc;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MachineTokenProvider {
    private final String serviceToken;

    public MachineTokenProvider(@Value("${post.security.internal.service-token:}") String serviceToken) {
        this.serviceToken = serviceToken == null ? "" : serviceToken.trim();
    }

    public String getToken() {
        return serviceToken;
    }
}
