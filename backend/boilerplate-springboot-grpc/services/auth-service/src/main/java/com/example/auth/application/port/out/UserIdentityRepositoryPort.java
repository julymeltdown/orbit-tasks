package com.example.auth.application.port.out;

import com.example.auth.domain.IdentityProvider;
import com.example.auth.domain.UserIdentity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserIdentityRepositoryPort {
    Optional<UserIdentity> findByProviderAndSubject(IdentityProvider providerType, String providerSubject);

    Optional<UserIdentity> findByProviderAndEmail(IdentityProvider providerType, String email);

    List<UserIdentity> findByEmail(String email);

    List<UserIdentity> findByUserId(UUID userId);

    UserIdentity save(UserIdentity identity);
}
