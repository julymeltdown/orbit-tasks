package com.example.auth.application.security;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import java.security.KeyPair;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

public class JwtTokenService {
    private final String issuer;
    private final Duration accessTtl;
    private final Duration refreshTtl;
    private final Clock clock;
    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final RSAKey rsaKey;
    private final String keyId;

    public JwtTokenService(String issuer, Duration accessTtl, Duration refreshTtl, KeyPair keyPair) {
        this(issuer, accessTtl, refreshTtl, keyPair, Clock.systemUTC());
    }

    public JwtTokenService(String issuer, Duration accessTtl, Duration refreshTtl, KeyPair keyPair, Clock clock) {
        this.issuer = issuer;
        this.accessTtl = accessTtl;
        this.refreshTtl = refreshTtl;
        this.clock = clock;
        this.keyId = UUID.randomUUID().toString();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        this.rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(keyId)
                .build();
        JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(new JWKSet(rsaKey));
        this.encoder = new NimbusJwtEncoder(jwkSource);
        this.decoder = NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    public String issueAccessToken(String subject, List<String> roles) {
        return issueToken(subject, roles, accessTtl, "access").token();
    }

    public TokenPair issueTokenPair(String subject, List<String> roles) {
        IssuedToken access = issueToken(subject, roles, accessTtl, "access");
        IssuedToken refresh = issueToken(subject, List.of(), refreshTtl, "refresh");
        return new TokenPair(
                access.token(),
                refresh.token(),
                access.jti(),
                refresh.jti(),
                access.expiresAt(),
                refresh.expiresAt());
    }

    public DecodedToken decode(String token) {
        Jwt jwt = decoder.decode(token);
        return new DecodedToken(jwt.getSubject(), jwt.getId(), jwt.getExpiresAt(),
                jwt.getClaimAsString("token_type"));
    }

    public Map<String, Object> jwkSet() {
        return new JWKSet(rsaKey.toPublicJWK()).toJSONObject();
    }

    private IssuedToken issueToken(String subject, List<String> roles, Duration ttl, String tokenType) {
        Instant now = clock.instant();
        String jti = UUID.randomUUID().toString();
        JwtClaimsSet.Builder builder = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(subject)
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .id(jti)
                .claim("token_type", tokenType);
        if (roles != null && !roles.isEmpty()) {
            builder.claim("roles", roles);
        }
        JwtClaimsSet claims = builder.build();
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256)
                .keyId(keyId)
                .build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new IssuedToken(token, jti, claims.getExpiresAt());
    }

    private record IssuedToken(String token, String jti, Instant expiresAt) {
    }

    public record TokenPair(String accessToken,
                            String refreshToken,
                            String accessJti,
                            String refreshJti,
                            Instant accessExpiresAt,
                            Instant refreshExpiresAt) {
    }

    public record DecodedToken(String subject, String jti, Instant expiresAt, String tokenType) {
    }
}
