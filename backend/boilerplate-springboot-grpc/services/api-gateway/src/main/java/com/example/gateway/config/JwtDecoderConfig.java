package com.example.gateway.config;

import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.util.StringUtils;

@Configuration
public class JwtDecoderConfig {

    @Bean
    JwtDecoder jwtDecoder(@Value("${gateway.jwt.public-key:}") String publicKeyPem,
                          @Value("${gateway.jwt.jwk-set-uri:}") String jwkSetUri) {
        if (StringUtils.hasText(publicKeyPem)) {
            return NimbusJwtDecoder.withPublicKey(parseRsaPublicKey(publicKeyPem)).build();
        }

        if (StringUtils.hasText(jwkSetUri)) {
            return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        }

        throw new IllegalStateException("JWT decoder configuration missing: set gateway.jwt.public-key or gateway.jwt.jwk-set-uri");
    }

    private RSAPublicKey parseRsaPublicKey(String pem) {
        try {
            String normalized = pem
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decoded = Base64.getDecoder().decode(normalized);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return (RSAPublicKey) keyFactory.generatePublic(keySpec);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse gateway.jwt.public-key", ex);
        }
    }
}
