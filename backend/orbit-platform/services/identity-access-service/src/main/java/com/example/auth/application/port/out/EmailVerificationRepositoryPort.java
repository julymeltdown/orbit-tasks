package com.example.auth.application.port.out;

import com.example.auth.domain.EmailVerification;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationRepositoryPort {
    Optional<EmailVerification> findById(UUID id);

    Optional<EmailVerification> findLatestByEmail(String email);

    EmailVerification save(EmailVerification verification);
}
