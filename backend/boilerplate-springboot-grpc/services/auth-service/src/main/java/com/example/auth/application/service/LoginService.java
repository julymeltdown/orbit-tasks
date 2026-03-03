package com.example.auth.application.service;

import com.example.auth.application.port.out.LoginAuditRepositoryPort;
import com.example.auth.application.port.out.RefreshTokenRecord;
import com.example.auth.application.port.out.RefreshTokenStorePort;
import com.example.auth.application.port.out.UserRepositoryPort;
import com.example.auth.application.security.JwtTokenService;
import com.example.auth.domain.LoginAudit;
import com.example.auth.domain.LoginMethod;
import com.example.auth.domain.User;
import com.example.auth.domain.UserStatus;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
    private final UserRepositoryPort userRepository;
    private final LoginAuditRepositoryPort loginAuditRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final RefreshTokenStorePort refreshTokenStore;
    private final Clock clock;

    public LoginService(UserRepositoryPort userRepository,
                        LoginAuditRepositoryPort loginAuditRepository,
                        PasswordEncoder passwordEncoder,
                        JwtTokenService jwtTokenService,
                        RefreshTokenStorePort refreshTokenStore,
                        Clock clock) {
        this.userRepository = userRepository;
        this.loginAuditRepository = loginAuditRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.refreshTokenStore = refreshTokenStore;
        this.clock = clock;
    }

    public AuthSession loginWithEmail(String email, String rawPassword, String ipAddress, String userAgent) {
        String normalizedEmail = normalize(email);
        Optional<User> userOptional = userRepository.findByPrimaryEmail(normalizedEmail);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        User user = userOptional.get();
        if (user.getStatus() != UserStatus.ACTIVE) {
            recordAudit(user, ipAddress, userAgent, false);
            throw new IllegalArgumentException("User not active");
        }
        if (user.getPasswordHash() == null || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            recordAudit(user, ipAddress, userAgent, false);
            throw new IllegalArgumentException("Invalid credentials");
        }
        User updated = new User(user.getId(), user.getPrimaryEmail(), user.getPasswordHash(), user.getStatus(),
                clock.instant());
        userRepository.save(updated);

        JwtTokenService.TokenPair tokens = jwtTokenService.issueTokenPair(user.getId().toString(), List.of("ROLE_USER"));
        RefreshTokenRecord record = new RefreshTokenRecord(
                tokens.refreshJti(),
                hashToken(tokens.refreshToken()),
                user.getId(),
                tokens.refreshExpiresAt());
        refreshTokenStore.store(record);
        recordAudit(user, ipAddress, userAgent, true);
        return new AuthSession(user.getId(), tokens);
    }

    public AuthSession refreshTokens(String refreshToken) {
        JwtTokenService.DecodedToken decoded = jwtTokenService.decode(refreshToken);
        String tokenHash = hashToken(refreshToken);
        RefreshTokenRecord existing = refreshTokenStore.find(decoded.jti())
                .orElseThrow(() -> new IllegalArgumentException("Refresh token revoked"));
        if (!existing.tokenHash().equals(tokenHash)) {
            throw new IllegalArgumentException("Refresh token mismatch");
        }
        JwtTokenService.TokenPair newTokens = jwtTokenService.issueTokenPair(decoded.subject(), List.of("ROLE_USER"));
        RefreshTokenRecord next = new RefreshTokenRecord(
                newTokens.refreshJti(),
                hashToken(newTokens.refreshToken()),
                UUID.fromString(decoded.subject()),
                newTokens.refreshExpiresAt());
        boolean rotated = refreshTokenStore.rotate(existing.jti(), tokenHash, next);
        if (!rotated) {
            throw new IllegalArgumentException("Refresh token reuse detected");
        }
        return new AuthSession(UUID.fromString(decoded.subject()), newTokens);
    }

    public void logout(String refreshToken) {
        JwtTokenService.DecodedToken decoded = jwtTokenService.decode(refreshToken);
        refreshTokenStore.revoke(decoded.jti());
    }

    private void recordAudit(User user, String ipAddress, String userAgent, boolean success) {
        LoginAudit audit = new LoginAudit(
                UUID.randomUUID(),
                user.getId(),
                LoginMethod.EMAIL,
                ipAddress,
                userAgent,
                success,
                clock.instant());
        loginAuditRepository.save(audit);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to hash token", ex);
        }
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
