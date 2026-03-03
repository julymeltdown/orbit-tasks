package com.example.auth.application.port.out;

import com.example.auth.domain.IdentityProvider;
import java.util.Collections;
import java.util.Map;

public record OAuthUserInfo(
        IdentityProvider provider,
        String subject,
        String email,
        boolean emailVerified,
        Map<String, Object> attributes) {
    public OAuthUserInfo {
        attributes = attributes == null ? Collections.emptyMap() : Map.copyOf(attributes);
    }
}
