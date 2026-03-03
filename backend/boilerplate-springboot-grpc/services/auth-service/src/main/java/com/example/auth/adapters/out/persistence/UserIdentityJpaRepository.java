package com.example.auth.adapters.out.persistence;

import com.example.auth.adapters.out.persistence.entity.UserIdentityEntity;
import com.example.auth.domain.IdentityProvider;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserIdentityJpaRepository extends JpaRepository<UserIdentityEntity, UUID> {
    Optional<UserIdentityEntity> findByProviderTypeAndProviderSubject(
            IdentityProvider providerType,
            String providerSubject);

    Optional<UserIdentityEntity> findByProviderTypeAndEmail(IdentityProvider providerType, String email);

    List<UserIdentityEntity> findByEmail(String email);

    List<UserIdentityEntity> findByUserId(UUID userId);
}
