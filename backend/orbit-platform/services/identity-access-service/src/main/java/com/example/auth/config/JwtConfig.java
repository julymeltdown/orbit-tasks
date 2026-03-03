package com.example.auth.config;

import com.example.auth.application.security.JwtTokenService;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public KeyPair jwtKeyPair(
            @Value("${jwt.key.private:}") String privateKeyPem,
            @Value("${jwt.key.public:}") String publicKeyPem) {
        if (privateKeyPem == null || privateKeyPem.isBlank()
                || publicKeyPem == null || publicKeyPem.isBlank()) {
            return generateKeyPair();
        }
        RSAPrivateKey privateKey = readPrivateKey(privateKeyPem);
        RSAPublicKey publicKey = readPublicKey(publicKeyPem);
        return new KeyPair(publicKey, privateKey);
    }

    @Bean
    public JwtTokenService jwtTokenService(
            @Value("${jwt.issuer:auth-service}") String issuer,
            @Value("${jwt.access-token-ttl:PT10M}") Duration accessTtl,
            @Value("${jwt.refresh-token-ttl:P14D}") Duration refreshTtl,
            KeyPair keyPair,
            Clock clock) {
        return new JwtTokenService(issuer, accessTtl, refreshTtl, keyPair, clock);
    }

    private KeyPair generateKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate JWT key pair", ex);
        }
    }

    private RSAPrivateKey readPrivateKey(String pem) {
        try {
            byte[] decoded = decodePem(pem);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return (RSAPrivateKey) keyFactory.generatePrivate(spec);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse private key", ex);
        }
    }

    private RSAPublicKey readPublicKey(String pem) {
        try {
            byte[] decoded = decodePem(pem);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return (RSAPublicKey) keyFactory.generatePublic(spec);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse public key", ex);
        }
    }

    private byte[] decodePem(String pem) {
        String sanitized = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(sanitized);
    }
}
