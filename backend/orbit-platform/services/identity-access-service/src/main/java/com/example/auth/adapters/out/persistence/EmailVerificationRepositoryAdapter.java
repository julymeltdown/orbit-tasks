package com.example.auth.adapters.out.persistence;

import com.example.auth.adapters.out.persistence.entity.EmailVerificationEntity;
import com.example.auth.application.port.out.EmailVerificationRepositoryPort;
import com.example.auth.domain.EmailVerification;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class EmailVerificationRepositoryAdapter implements EmailVerificationRepositoryPort {
    private final EmailVerificationJpaRepository repository;

    public EmailVerificationRepositoryAdapter(EmailVerificationJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<EmailVerification> findById(UUID id) {
        return repository.findById(id).map(EmailVerificationRepositoryAdapter::toDomain);
    }

    @Override
    public Optional<EmailVerification> findLatestByEmail(String email) {
        return repository.findFirstByEmailOrderByCreatedAtDesc(email)
                .map(EmailVerificationRepositoryAdapter::toDomain);
    }

    @Override
    public EmailVerification save(EmailVerification verification) {
        EmailVerificationEntity saved = repository.save(toEntity(verification));
        return toDomain(saved);
    }

    private static EmailVerification toDomain(EmailVerificationEntity entity) {
        return new EmailVerification(
                entity.getId(),
                entity.getUserId(),
                entity.getEmail(),
                entity.getCodeHash(),
                entity.getExpiresAt(),
                entity.getAttempts(),
                entity.getMaxAttempts(),
                entity.getStatus());
    }

    private static EmailVerificationEntity toEntity(EmailVerification verification) {
        EmailVerificationEntity entity = new EmailVerificationEntity();
        entity.setId(verification.getId());
        entity.setUserId(verification.getUserId());
        entity.setEmail(verification.getEmail());
        entity.setCodeHash(verification.getCodeHash());
        entity.setExpiresAt(verification.getExpiresAt());
        entity.setAttempts(verification.getAttempts());
        entity.setMaxAttempts(verification.getMaxAttempts());
        entity.setStatus(verification.getStatus());
        return entity;
    }
}
