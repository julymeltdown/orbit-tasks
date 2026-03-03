package com.example.auth.application.service;

import com.example.auth.application.port.out.EmailSenderPort;
import com.example.auth.application.port.out.PasswordResetTokenRepositoryPort;
import com.example.auth.application.port.out.UserRepositoryPort;
import com.example.auth.domain.PasswordResetStatus;
import com.example.auth.domain.PasswordResetToken;
import com.example.auth.domain.User;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {
    private static final Duration DEFAULT_TTL = Duration.ofHours(1);
    private static final String DEFAULT_BASE_URL = "http://localhost:3000/auth/reset";
    private static final int TOKEN_BYTES = 32;

    private final PasswordResetTokenRepositoryPort tokenRepository;
    private final UserRepositoryPort userRepository;
    private final EmailSenderPort emailSender;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final Duration ttl;
    private final String baseUrl;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(PasswordResetTokenRepositoryPort tokenRepository,
                                UserRepositoryPort userRepository,
                                EmailSenderPort emailSender,
                                PasswordEncoder passwordEncoder,
                                Clock clock) {
        this(tokenRepository, userRepository, emailSender, passwordEncoder, clock, DEFAULT_TTL, DEFAULT_BASE_URL);
    }

    @Autowired
    public PasswordResetService(PasswordResetTokenRepositoryPort tokenRepository,
                                UserRepositoryPort userRepository,
                                EmailSenderPort emailSender,
                                PasswordEncoder passwordEncoder,
                                Clock clock,
                                @Value("${auth.password.reset.ttl:PT1H}") Duration ttl,
                                @Value("${auth.password.reset.base-url:http://localhost:3000/auth/reset}")
                                String baseUrl) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.emailSender = emailSender;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.ttl = ttl == null ? DEFAULT_TTL : ttl;
        this.baseUrl = baseUrl == null || baseUrl.isBlank() ? DEFAULT_BASE_URL : baseUrl;
    }

    public void requestReset(String email) {
        String normalizedEmail = normalize(email);
        Optional<User> userOptional = userRepository.findByPrimaryEmail(normalizedEmail);
        if (userOptional.isEmpty()) {
            return;
        }
        expirePreviousToken(normalizedEmail);
        User user = userOptional.get();
        String rawToken = generateToken();
        String tokenHash = hashToken(rawToken);
        PasswordResetToken token = new PasswordResetToken(
                UUID.randomUUID(),
                user.getId(),
                normalizedEmail,
                tokenHash,
                clock.instant().plus(ttl),
                PasswordResetStatus.PENDING);
        tokenRepository.save(token);
        String link = buildResetLink(rawToken);
        emailSender.sendPasswordResetLink(normalizedEmail, link);
    }

    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = hashToken(rawToken);
        PasswordResetToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));
        if (token.getStatus() != PasswordResetStatus.PENDING) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }
        if (token.getExpiresAt().isBefore(clock.instant())) {
            PasswordResetToken expired = new PasswordResetToken(
                    token.getId(),
                    token.getUserId(),
                    token.getEmail(),
                    token.getTokenHash(),
                    token.getExpiresAt(),
                    PasswordResetStatus.EXPIRED);
            tokenRepository.save(expired);
            throw new IllegalArgumentException("Invalid or expired reset token");
        }
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found for reset token"));
        User updated = new User(
                user.getId(),
                user.getPrimaryEmail(),
                passwordEncoder.encode(newPassword),
                user.getStatus(),
                user.getLastLoginAt());
        userRepository.save(updated);
        PasswordResetToken used = new PasswordResetToken(
                token.getId(),
                token.getUserId(),
                token.getEmail(),
                token.getTokenHash(),
                token.getExpiresAt(),
                PasswordResetStatus.USED);
        tokenRepository.save(used);
    }

    static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to hash reset token", ex);
        }
    }

    private String generateToken() {
        byte[] buffer = new byte[TOKEN_BYTES];
        random.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    private void expirePreviousToken(String email) {
        Optional<PasswordResetToken> latest = tokenRepository.findLatestByEmail(email);
        if (latest.isEmpty()) {
            return;
        }
        PasswordResetToken existing = latest.get();
        if (existing.getStatus() != PasswordResetStatus.PENDING) {
            return;
        }
        PasswordResetToken expired = new PasswordResetToken(
                existing.getId(),
                existing.getUserId(),
                existing.getEmail(),
                existing.getTokenHash(),
                existing.getExpiresAt(),
                PasswordResetStatus.EXPIRED);
        tokenRepository.save(expired);
    }

    private String buildResetLink(String rawToken) {
        String encoded = URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        if (baseUrl.contains("?")) {
            return baseUrl + "&token=" + encoded;
        }
        return baseUrl + "?token=" + encoded;
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
