package com.example.auth.adapters.out.oauth;

import com.example.auth.application.port.out.OAuthUserInfo;
import com.example.auth.domain.IdentityProvider;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class OAuthUserInfoMapper {
    public OAuthUserInfo map(IdentityProvider provider, Map<String, Object> attributes) {
        String subject = claim(attributes, "sub");
        String email = claim(attributes, "email");
        boolean emailVerified = booleanClaim(attributes, "email_verified");
        return new OAuthUserInfo(provider, subject, email, emailVerified, attributes);
    }

    private String claim(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value == null ? null : value.toString();
    }

    private boolean booleanClaim(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        if (value instanceof Boolean boolValue) {
            return boolValue;
        }
        if (value instanceof String stringValue) {
            return Boolean.parseBoolean(stringValue);
        }
        return false;
    }
}
