package com.example.auth.application.service;

import com.example.auth.application.port.out.EmailSenderPort;
import com.example.auth.application.port.out.EmailVerificationRepositoryPort;
import com.example.auth.domain.EmailVerification;
import com.example.auth.domain.EmailVerificationStatus;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailVerificationService {
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);
    private static final int DEFAULT_MAX_ATTEMPTS = 5;
    private static final int CODE_LENGTH = 6;

    private final EmailVerificationRepositoryPort repository;
    private final EmailSenderPort emailSender;
    private final Clock clock;
    private final Duration ttl;
    private final int maxAttempts;
    private final SecureRandom random = new SecureRandom();

    public EmailVerificationService(EmailVerificationRepositoryPort repository,
                                    EmailSenderPort emailSender,
                                    Clock clock) {
        this(repository, emailSender, clock, DEFAULT_TTL, DEFAULT_MAX_ATTEMPTS);
    }

    @Autowired
    public EmailVerificationService(EmailVerificationRepositoryPort repository,
                                    EmailSenderPort emailSender,
                                    Clock clock,
                                    @Value("${auth.email.verification.ttl:PT10M}") Duration ttl,
                                    @Value("${auth.email.verification.max-attempts:5}") int maxAttempts) {
        this.repository = repository;
        this.emailSender = emailSender;
        this.clock = clock;
        this.ttl = ttl;
        this.maxAttempts = maxAttempts;
    }

    public String generateCode() {
        int value = random.nextInt((int) Math.pow(10, CODE_LENGTH));
        return String.format("%0" + CODE_LENGTH + "d", value);
    }

    public EmailVerification createVerification(String email, UUID userId) {
        String code = generateCode();
        EmailVerification verification = new EmailVerification(
                UUID.randomUUID(),
                userId,
                email,
                hashCode(code),
                clock.instant().plus(ttl),
                0,
                maxAttempts,
                EmailVerificationStatus.PENDING);
        EmailVerification saved = repository.save(verification);
        emailSender.sendVerificationCode(email, code);
        return saved;
    }

    public Optional<EmailVerification> verifyCode(String email, String code) {
        Optional<EmailVerification> latest = repository.findLatestByEmail(email);
        if (latest.isEmpty()) {
            return Optional.empty();
        }
        EmailVerification verification = latest.get();
        if (verification.getStatus() != EmailVerificationStatus.PENDING) {
            return Optional.empty();
        }
        if (verification.getExpiresAt().isBefore(clock.instant())) {
            EmailVerification expired = new EmailVerification(
                    verification.getId(),
                    verification.getUserId(),
                    verification.getEmail(),
                    verification.getCodeHash(),
                    verification.getExpiresAt(),
                    verification.getAttempts(),
                    verification.getMaxAttempts(),
                    EmailVerificationStatus.EXPIRED);
            repository.save(expired);
            return Optional.empty();
        }
        if (!verification.getCodeHash().equals(hashCode(code))) {
            int nextAttempts = verification.getAttempts() + 1;
            EmailVerificationStatus status = nextAttempts >= verification.getMaxAttempts()
                    ? EmailVerificationStatus.LOCKED
                    : EmailVerificationStatus.PENDING;
            EmailVerification updated = new EmailVerification(
                    verification.getId(),
                    verification.getUserId(),
                    verification.getEmail(),
                    verification.getCodeHash(),
                    verification.getExpiresAt(),
                    nextAttempts,
                    verification.getMaxAttempts(),
                    status);
            repository.save(updated);
            return Optional.empty();
        }
        EmailVerification verified = new EmailVerification(
                verification.getId(),
                verification.getUserId(),
                verification.getEmail(),
                verification.getCodeHash(),
                verification.getExpiresAt(),
                verification.getAttempts(),
                verification.getMaxAttempts(),
                EmailVerificationStatus.VERIFIED);
        repository.save(verified);
        return Optional.of(verified);
    }

    private String hashCode(String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(code.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to hash verification code", ex);
        }
    }
}
