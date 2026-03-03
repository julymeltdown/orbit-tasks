package com.example.auth.adapters.out.persistence;

import com.example.auth.adapters.out.persistence.entity.UserIdentityEntity;
import com.example.auth.application.port.out.UserIdentityRepositoryPort;
import com.example.auth.domain.IdentityProvider;
import com.example.auth.domain.UserIdentity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

@Repository
public class UserIdentityRepositoryAdapter implements UserIdentityRepositoryPort {
    private final UserIdentityJpaRepository repository;

    public UserIdentityRepositoryAdapter(UserIdentityJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<UserIdentity> findByProviderAndSubject(IdentityProvider providerType, String providerSubject) {
        return repository.findByProviderTypeAndProviderSubject(providerType, providerSubject)
                .map(UserIdentityRepositoryAdapter::toDomain);
    }

    @Override
    public Optional<UserIdentity> findByProviderAndEmail(IdentityProvider providerType, String email) {
        return repository.findByProviderTypeAndEmail(providerType, email)
                .map(UserIdentityRepositoryAdapter::toDomain);
    }

    @Override
    public List<UserIdentity> findByUserId(UUID userId) {
        return repository.findByUserId(userId).stream()
                .map(UserIdentityRepositoryAdapter::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserIdentity> findByEmail(String email) {
        return repository.findByEmail(email).stream()
                .map(UserIdentityRepositoryAdapter::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public UserIdentity save(UserIdentity identity) {
        UserIdentityEntity saved = repository.save(toEntity(identity));
        return toDomain(saved);
    }

    private static UserIdentity toDomain(UserIdentityEntity entity) {
        return new UserIdentity(
                entity.getId(),
                entity.getUserId(),
                entity.getProviderType(),
                entity.getProviderSubject(),
                entity.getEmail(),
                entity.isEmailVerified(),
                entity.getLinkedAt());
    }

    private static UserIdentityEntity toEntity(UserIdentity identity) {
        UserIdentityEntity entity = new UserIdentityEntity();
        entity.setId(identity.getId());
        entity.setUserId(identity.getUserId());
        entity.setProviderType(identity.getProviderType());
        entity.setProviderSubject(identity.getProviderSubject());
        entity.setEmail(identity.getEmail());
        entity.setEmailVerified(identity.isEmailVerified());
        entity.setLinkedAt(identity.getLinkedAt());
        return entity;
    }
}
