package com.example.auth.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.auth.application.port.out.EmailSenderPort;
import com.example.auth.application.port.out.EmailVerificationRepositoryPort;
import com.example.auth.domain.EmailVerification;
import com.example.auth.domain.EmailVerificationStatus;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class EmailVerificationServiceTest {
    @Test
    void generatesSixDigitCode() {
        EmailVerificationService service = new EmailVerificationService(null, null, Clock.systemUTC());
        String code = service.generateCode();
        assertThat(code).hasSize(6).containsOnlyDigits();
    }

    @Test
    void createVerificationSavesPendingVerificationAndSendsEmail() {
        Instant now = Instant.parse("2026-01-20T00:00:00Z");
        MutableClock clock = new MutableClock(now, ZoneOffset.UTC);
        InMemoryEmailVerificationRepository repository = new InMemoryEmailVerificationRepository();
        CapturingEmailSender emailSender = new CapturingEmailSender();
        EmailVerificationService service = new EmailVerificationService(
                repository,
                emailSender,
                clock,
                Duration.ofMinutes(15),
                3);

        UUID userId = UUID.randomUUID();
        EmailVerification created = service.createVerification("User@Example.com", userId);

        assertThat(created.getEmail()).isEqualTo("User@Example.com");
        assertThat(created.getUserId()).isEqualTo(userId);
        assertThat(created.getStatus()).isEqualTo(EmailVerificationStatus.PENDING);
        assertThat(created.getExpiresAt()).isEqualTo(now.plus(Duration.ofMinutes(15)));
        assertThat(created.getAttempts()).isZero();
        assertThat(created.getMaxAttempts()).isEqualTo(3);

        assertThat(emailSender.lastEmail.get()).isEqualTo("User@Example.com");
        assertThat(emailSender.lastVerificationCode.get()).hasSize(6).containsOnlyDigits();

        EmailVerification saved = repository.findById(created.getId()).orElseThrow();
        assertThat(saved.getCodeHash()).isNotBlank();
        assertThat(saved.getCodeHash()).isNotEqualTo(emailSender.lastVerificationCode.get());
    }

    @Test
    void verifyCodeMarksVerifiedWhenCodeMatches() {
        Instant now = Instant.parse("2026-01-20T00:00:00Z");
        MutableClock clock = new MutableClock(now, ZoneOffset.UTC);
        InMemoryEmailVerificationRepository repository = new InMemoryEmailVerificationRepository();
        CapturingEmailSender emailSender = new CapturingEmailSender();
        EmailVerificationService service = new EmailVerificationService(
                repository,
                emailSender,
                clock,
                Duration.ofMinutes(10),
                5);

        UUID userId = UUID.randomUUID();
        service.createVerification("test@example.com", userId);
        String code = emailSender.lastVerificationCode.get();

        Optional<EmailVerification> verifiedOptional = service.verifyCode("test@example.com", code);

        assertThat(verifiedOptional).isPresent();
        EmailVerification verified = verifiedOptional.orElseThrow();
        assertThat(verified.getStatus()).isEqualTo(EmailVerificationStatus.VERIFIED);
        EmailVerification saved = repository.findLatestByEmail("test@example.com").orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(EmailVerificationStatus.VERIFIED);
    }

    @Test
    void verifyCodeIncrementsAttemptsAndLocksAfterMaxAttempts() {
        Instant now = Instant.parse("2026-01-20T00:00:00Z");
        MutableClock clock = new MutableClock(now, ZoneOffset.UTC);
        InMemoryEmailVerificationRepository repository = new InMemoryEmailVerificationRepository();
        CapturingEmailSender emailSender = new CapturingEmailSender();
        EmailVerificationService service = new EmailVerificationService(
                repository,
                emailSender,
                clock,
                Duration.ofMinutes(10),
                2);

        UUID userId = UUID.randomUUID();
        service.createVerification("lock@example.com", userId);
        String correct = emailSender.lastVerificationCode.get();

        assertThat(service.verifyCode("lock@example.com", "000000")).isEmpty();
        EmailVerification afterFirst = repository.findLatestByEmail("lock@example.com").orElseThrow();
        assertThat(afterFirst.getAttempts()).isEqualTo(1);
        assertThat(afterFirst.getStatus()).isEqualTo(EmailVerificationStatus.PENDING);

        assertThat(service.verifyCode("lock@example.com", "111111")).isEmpty();
        EmailVerification afterSecond = repository.findLatestByEmail("lock@example.com").orElseThrow();
        assertThat(afterSecond.getAttempts()).isEqualTo(2);
        assertThat(afterSecond.getStatus()).isEqualTo(EmailVerificationStatus.LOCKED);

        assertThat(service.verifyCode("lock@example.com", correct)).isEmpty();
        EmailVerification afterCorrect = repository.findLatestByEmail("lock@example.com").orElseThrow();
        assertThat(afterCorrect.getStatus()).isEqualTo(EmailVerificationStatus.LOCKED);
    }

    @Test
    void verifyCodeMarksExpiredWhenPastTtl() {
        Instant now = Instant.parse("2026-01-20T00:00:00Z");
        MutableClock clock = new MutableClock(now, ZoneOffset.UTC);
        InMemoryEmailVerificationRepository repository = new InMemoryEmailVerificationRepository();
        CapturingEmailSender emailSender = new CapturingEmailSender();
        EmailVerificationService service = new EmailVerificationService(
                repository,
                emailSender,
                clock,
                Duration.ofSeconds(5),
                5);

        UUID userId = UUID.randomUUID();
        service.createVerification("expire@example.com", userId);
        String correct = emailSender.lastVerificationCode.get();

        clock.advance(Duration.ofSeconds(10));

        assertThat(service.verifyCode("expire@example.com", correct)).isEmpty();
        EmailVerification saved = repository.findLatestByEmail("expire@example.com").orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(EmailVerificationStatus.EXPIRED);
    }

    private static final class CapturingEmailSender implements EmailSenderPort {
        private final AtomicReference<String> lastEmail = new AtomicReference<>();
        private final AtomicReference<String> lastVerificationCode = new AtomicReference<>();

        @Override
        public void sendVerificationCode(String email, String code) {
            lastEmail.set(email);
            lastVerificationCode.set(code);
        }

        @Override
        public void sendPasswordResetLink(String email, String link) {
            lastEmail.set(email);
        }
    }

    private static final class InMemoryEmailVerificationRepository implements EmailVerificationRepositoryPort {
        private final Map<UUID, EmailVerification> byId = new ConcurrentHashMap<>();
        private final Map<String, UUID> latestByEmail = new ConcurrentHashMap<>();

        @Override
        public Optional<EmailVerification> findById(UUID id) {
            return Optional.ofNullable(byId.get(id));
        }

        @Override
        public Optional<EmailVerification> findLatestByEmail(String email) {
            UUID id = latestByEmail.get(normalize(email));
            return id == null ? Optional.empty() : findById(id);
        }

        @Override
        public EmailVerification save(EmailVerification verification) {
            byId.put(verification.getId(), verification);
            latestByEmail.put(normalize(verification.getEmail()), verification.getId());
            return verification;
        }

        private String normalize(String email) {
            return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        }
    }

    private static final class MutableClock extends Clock {
        private final ZoneId zoneId;
        private Instant instant;

        private MutableClock(Instant instant, ZoneId zoneId) {
            this.instant = instant;
            this.zoneId = zoneId;
        }

        @Override
        public ZoneId getZone() {
            return zoneId;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }
    }
}
