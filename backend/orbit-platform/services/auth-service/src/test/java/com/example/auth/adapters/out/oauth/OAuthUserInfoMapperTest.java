package com.example.auth.adapters.out.oauth;

import com.example.auth.application.port.out.OAuthUserInfo;
import com.example.auth.domain.IdentityProvider;
import java.util.Map;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

class OAuthUserInfoMapperTest {
    private final OAuthUserInfoMapper mapper = new OAuthUserInfoMapper();

    @Test
    void mapsGoogleAttributes() {
        OAuthUserInfo info = mapper.map(IdentityProvider.GOOGLE, Map.of(
                "sub", "google-sub",
                "email", "user@example.com",
                "email_verified", true));

        Assertions.assertThat(info.provider()).isEqualTo(IdentityProvider.GOOGLE);
        Assertions.assertThat(info.subject()).isEqualTo("google-sub");
        Assertions.assertThat(info.email()).isEqualTo("user@example.com");
        Assertions.assertThat(info.emailVerified()).isTrue();
    }

    @Test
    void mapsStringBoolean() {
        OAuthUserInfo info = mapper.map(IdentityProvider.APPLE, Map.of(
                "sub", "apple-sub",
                "email", "apple@example.com",
                "email_verified", "false"));

        Assertions.assertThat(info.emailVerified()).isFalse();
    }
}
