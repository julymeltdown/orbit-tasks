package com.example.auth.adapters.out.persistence;

import com.example.auth.adapters.out.persistence.entity.PasswordResetTokenEntity;
import com.example.auth.application.port.out.PasswordResetTokenRepositoryPort;
import com.example.auth.domain.PasswordResetToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class PasswordResetTokenRepositoryAdapter implements PasswordResetTokenRepositoryPort {
    private final PasswordResetTokenJpaRepository repository;

    public PasswordResetTokenRepositoryAdapter(PasswordResetTokenJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<PasswordResetToken> findByTokenHash(String tokenHash) {
        return repository.findByTokenHash(tokenHash)
                .map(PasswordResetTokenRepositoryAdapter::toDomain);
    }

    @Override
    public Optional<PasswordResetToken> findLatestByEmail(String email) {
        return repository.findFirstByEmailOrderByCreatedAtDesc(email)
                .map(PasswordResetTokenRepositoryAdapter::toDomain);
    }

    @Override
    public PasswordResetToken save(PasswordResetToken token) {
        PasswordResetTokenEntity saved = repository.save(toEntity(token));
        return toDomain(saved);
    }

    private static PasswordResetToken toDomain(PasswordResetTokenEntity entity) {
        return new PasswordResetToken(
                entity.getId(),
                entity.getUserId(),
                entity.getEmail(),
                entity.getTokenHash(),
                entity.getExpiresAt(),
                entity.getStatus());
    }

    private static PasswordResetTokenEntity toEntity(PasswordResetToken token) {
        PasswordResetTokenEntity entity = new PasswordResetTokenEntity();
        entity.setId(token.getId());
        entity.setUserId(token.getUserId());
        entity.setEmail(token.getEmail());
        entity.setTokenHash(token.getTokenHash());
        entity.setExpiresAt(token.getExpiresAt());
        entity.setStatus(token.getStatus());
        return entity;
    }
}
