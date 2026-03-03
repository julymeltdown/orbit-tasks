package com.example.auth.application.service;

import com.example.auth.application.port.out.UserIdentityRepositoryPort;
import com.example.auth.domain.IdentityProvider;
import com.example.auth.domain.UserIdentity;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class UserIdentityService {
    private final UserIdentityRepositoryPort identityRepository;
    private final Clock clock;

    public UserIdentityService(UserIdentityRepositoryPort identityRepository, Clock clock) {
        this.identityRepository = identityRepository;
        this.clock = clock;
    }

    public Optional<UserIdentity> findByProviderAndEmail(IdentityProvider provider, String email) {
        return identityRepository.findByProviderAndEmail(provider, email);
    }

    public Optional<UserIdentity> findByProviderAndSubject(IdentityProvider provider, String subject) {
        return identityRepository.findByProviderAndSubject(provider, subject);
    }

    public List<UserIdentity> findByEmail(String email) {
        return identityRepository.findByEmail(email);
    }

    public List<IdentityProvider> findLinkedProviders(UUID userId) {
        return identityRepository.findByUserId(userId).stream()
                .map(UserIdentity::getProviderType)
                .collect(Collectors.toList());
    }

    public UserIdentity linkEmailIdentity(UUID userId, String email, boolean emailVerified) {
        return linkIdentity(userId, IdentityProvider.EMAIL, null, email, emailVerified);
    }

    public UserIdentity markEmailVerified(UUID userId, String email) {
        UserIdentity identity = identityRepository.findByProviderAndEmail(IdentityProvider.EMAIL, email)
                .orElseThrow(() -> new IllegalArgumentException("Email identity not found"));
        if (!identity.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Email identity belongs to another user");
        }
        if (identity.isEmailVerified()) {
            return identity;
        }
        UserIdentity updated = new UserIdentity(
                identity.getId(),
                identity.getUserId(),
                identity.getProviderType(),
                identity.getProviderSubject(),
                identity.getEmail(),
                true,
                identity.getLinkedAt());
        return identityRepository.save(updated);
    }

    public UserIdentity linkOAuthIdentity(UUID userId,
                                          IdentityProvider provider,
                                          String subject,
                                          String email,
                                          boolean emailVerified) {
        if (provider == IdentityProvider.EMAIL) {
            throw new IllegalArgumentException("OAuth provider required");
        }
        return linkIdentity(userId, provider, subject, email, emailVerified);
    }

    private UserIdentity linkIdentity(UUID userId,
                                      IdentityProvider provider,
                                      String subject,
                                      String email,
                                      boolean emailVerified) {
        Optional<UserIdentity> existing = provider == IdentityProvider.EMAIL
                ? identityRepository.findByProviderAndEmail(provider, email)
                : identityRepository.findByProviderAndSubject(provider, subject);
        if (existing.isPresent()) {
            UserIdentity identity = existing.get();
            if (!identity.getUserId().equals(userId)) {
                throw new IllegalArgumentException("Identity already linked to another user");
            }
            boolean mergedVerified = identity.isEmailVerified() || emailVerified;
            UserIdentity updated = new UserIdentity(
                    identity.getId(),
                    identity.getUserId(),
                    provider,
                    subject,
                    email,
                    mergedVerified,
                    identity.getLinkedAt());
            return identityRepository.save(updated);
        }
        UserIdentity identity = new UserIdentity(
                UUID.randomUUID(),
                userId,
                provider,
                subject,
                email,
                emailVerified,
                clock.instant());
        return identityRepository.save(identity);
    }
}
