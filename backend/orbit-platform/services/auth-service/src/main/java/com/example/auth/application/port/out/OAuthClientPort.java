package com.example.auth.application.port.out;

import com.example.auth.domain.IdentityProvider;

public interface OAuthClientPort {
    OAuthUserInfo fetchUserInfo(IdentityProvider provider, String code, String redirectUri);

    String buildAuthorizationUri(IdentityProvider provider, String redirectUri, String state);
}
