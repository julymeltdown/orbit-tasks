package com.example.auth.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.auth.application.port.out.EmailSenderPort;
import com.example.auth.application.port.out.PasswordResetTokenRepositoryPort;
import com.example.auth.application.port.out.UserRepositoryPort;
import com.example.auth.domain.PasswordResetStatus;
import com.example.auth.domain.PasswordResetToken;
import com.example.auth.domain.User;
import com.example.auth.domain.UserStatus;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class PasswordResetServiceTest {
    private static final Instant NOW = Instant.parse("2026-01-20T00:00:00Z");
    private static final Clock CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);

    @Test
    void requestResetSendsLinkAndResetsPassword() {
        InMemoryUserRepository userRepository = new InMemoryUserRepository();
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        User user = new User(UUID.randomUUID(), "test@example.com", passwordEncoder.encode("oldPassword"),
                UserStatus.ACTIVE, NOW);
        userRepository.save(user);
        InMemoryPasswordResetTokenRepository tokenRepository = new InMemoryPasswordResetTokenRepository(CLOCK);
        CapturingEmailSender emailSender = new CapturingEmailSender();

        PasswordResetService service = new PasswordResetService(
                tokenRepository,
                userRepository,
                emailSender,
                passwordEncoder,
                CLOCK,
                Duration.ofHours(1),
                "http://localhost:3000/auth/reset");

        service.requestReset("TEST@Example.com");

        assertThat(emailSender.lastLink).contains("token=");
        PasswordResetToken token = tokenRepository.latestToken();
        assertThat(token.getEmail()).isEqualTo("test@example.com");
        assertThat(token.getExpiresAt()).isEqualTo(NOW.plus(Duration.ofHours(1)));
        assertThat(token.getStatus()).isEqualTo(PasswordResetStatus.PENDING);

        String rawToken = extractToken(emailSender.lastLink);
        service.resetPassword(rawToken, "newPassword123!");

        User updated = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("newPassword123!", updated.getPasswordHash())).isTrue();
        PasswordResetToken updatedToken = tokenRepository.findById(token.getId()).orElseThrow();
        assertThat(updatedToken.getStatus()).isEqualTo(PasswordResetStatus.USED);
    }

    @Test
    void expiredTokenIsRejectedAndMarkedExpired() {
        InMemoryUserRepository userRepository = new InMemoryUserRepository();
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        User user = new User(UUID.randomUUID(), "expired@example.com", passwordEncoder.encode("oldPassword"),
                UserStatus.ACTIVE, NOW);
        userRepository.save(user);
        InMemoryPasswordResetTokenRepository tokenRepository = new InMemoryPasswordResetTokenRepository(CLOCK);
        CapturingEmailSender emailSender = new CapturingEmailSender();

        PasswordResetService service = new PasswordResetService(
                tokenRepository,
                userRepository,
                emailSender,
                passwordEncoder,
                CLOCK,
                Duration.ofHours(1),
                "http://localhost:3000/auth/reset");

        String rawToken = "expired-token";
        String tokenHash = PasswordResetService.hashToken(rawToken);
        PasswordResetToken expired = new PasswordResetToken(
                UUID.randomUUID(),
                user.getId(),
                user.getPrimaryEmail(),
                tokenHash,
                NOW.minus(Duration.ofMinutes(5)),
                PasswordResetStatus.PENDING);
        tokenRepository.save(expired);

        assertThatThrownBy(() -> service.resetPassword(rawToken, "newPassword123!"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("reset token");

        PasswordResetToken updated = tokenRepository.findById(expired.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(PasswordResetStatus.EXPIRED);
    }

    private static String extractToken(String link) {
        URI uri = URI.create(link);
        String query = uri.getQuery();
        if (query == null) {
            throw new IllegalArgumentException("Missing token query");
        }
        for (String pair : query.split("&")) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 2 && "token".equals(parts[0])) {
                return URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
            }
        }
        throw new IllegalArgumentException("Missing token parameter");
    }

    private static final class CapturingEmailSender implements EmailSenderPort {
        private String lastEmail;
        private String lastLink;

        @Override
        public void sendVerificationCode(String email, String code) {
            this.lastEmail = email;
        }

        @Override
        public void sendPasswordResetLink(String email, String link) {
            this.lastEmail = email;
            this.lastLink = link;
        }
    }

    private static final class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepositoryPort {
        private final Clock clock;
        private final Map<UUID, StoredToken> tokens = new ConcurrentHashMap<>();

        private InMemoryPasswordResetTokenRepository(Clock clock) {
            this.clock = clock;
        }

        @Override
        public Optional<PasswordResetToken> findByTokenHash(String tokenHash) {
            return tokens.values().stream()
                    .map(StoredToken::token)
                    .filter(token -> token.getTokenHash().equals(tokenHash))
                    .findFirst();
        }

        @Override
        public Optional<PasswordResetToken> findLatestByEmail(String email) {
            return tokens.values().stream()
                    .filter(entry -> entry.token().getEmail().equalsIgnoreCase(email))
                    .sorted(Comparator.comparing(StoredToken::savedAt).reversed())
                    .map(StoredToken::token)
                    .findFirst();
        }

        @Override
        public PasswordResetToken save(PasswordResetToken token) {
            tokens.put(token.getId(), new StoredToken(token, clock.instant()));
            return token;
        }

        Optional<PasswordResetToken> findById(UUID id) {
            StoredToken stored = tokens.get(id);
            return stored == null ? Optional.empty() : Optional.of(stored.token());
        }

        PasswordResetToken latestToken() {
            return tokens.values().stream()
                    .sorted(Comparator.comparing(StoredToken::savedAt).reversed())
                    .map(StoredToken::token)
                    .findFirst()
                    .orElseThrow();
        }

        private record StoredToken(PasswordResetToken token, Instant savedAt) {
        }
    }

    private static final class InMemoryUserRepository implements UserRepositoryPort {
        private final Map<UUID, User> users = new ConcurrentHashMap<>();

        @Override
        public Optional<User> findById(UUID id) {
            return Optional.ofNullable(users.get(id));
        }

        @Override
        public Optional<User> findByPrimaryEmail(String email) {
            String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
            return users.values().stream()
                    .filter(user -> user.getPrimaryEmail().equalsIgnoreCase(normalized))
                    .findFirst();
        }

        @Override
        public User save(User user) {
            users.put(user.getId(), user);
            return user;
        }
    }
}
