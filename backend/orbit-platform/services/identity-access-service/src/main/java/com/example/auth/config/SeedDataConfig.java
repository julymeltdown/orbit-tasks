package com.example.auth.config;

import com.example.auth.adapters.out.persistence.EmailVerificationJpaRepository;
import com.example.auth.adapters.out.persistence.LoginAuditJpaRepository;
import com.example.auth.adapters.out.persistence.UserIdentityJpaRepository;
import com.example.auth.adapters.out.persistence.UserJpaRepository;
import com.example.auth.adapters.out.persistence.entity.UserEntity;
import com.example.auth.adapters.out.persistence.entity.UserIdentityEntity;
import com.example.auth.domain.IdentityProvider;
import com.example.auth.domain.UserStatus;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("local")
@ConditionalOnProperty(name = "auth.seed.enabled", havingValue = "true")
public class SeedDataConfig {
    @Bean
    CommandLineRunner seedUsers(UserJpaRepository userRepository,
                                UserIdentityJpaRepository identityRepository,
                                EmailVerificationJpaRepository verificationRepository,
                                LoginAuditJpaRepository loginAuditRepository,
                                PasswordEncoder passwordEncoder,
                                Clock clock,
                                @Value("${auth.seed.reset:true}") boolean reset) {
        return args -> {
            if (reset) {
                loginAuditRepository.deleteAllInBatch();
                verificationRepository.deleteAllInBatch();
                identityRepository.deleteAllInBatch();
                userRepository.deleteAllInBatch();
            }
            Instant now = clock.instant();
            for (SeedUser seed : seedUsers()) {
                UserEntity user = new UserEntity();
                user.setId(UUID.fromString(seed.userId()));
                user.setPrimaryEmail(seed.email());
                user.setPasswordHash(passwordEncoder.encode(seed.rawPassword()));
                user.setStatus(UserStatus.ACTIVE);
                user.setLastLoginAt(now);
                userRepository.save(user);

                UserIdentityEntity identity = new UserIdentityEntity();
                identity.setId(UUID.randomUUID());
                identity.setUserId(UUID.fromString(seed.userId()));
                identity.setProviderType(IdentityProvider.EMAIL);
                identity.setProviderSubject(null);
                identity.setEmail(seed.email());
                identity.setEmailVerified(true);
                identity.setLinkedAt(now);
                identityRepository.save(identity);
            }
        };
    }

    private List<SeedUser> seedUsers() {
        return List.of(
                new SeedUser("11111111-1111-1111-1111-111111111111", "hana@example.com", "Passw0rd!"),
                new SeedUser("22222222-2222-2222-2222-222222222222", "jin@example.com", "Passw0rd!"),
                new SeedUser("33333333-3333-3333-3333-333333333333", "soyeon@example.com", "Passw0rd!"),
                new SeedUser("44444444-4444-4444-4444-444444444444", "mira@example.com", "Passw0rd!"),
                new SeedUser("55555555-5555-5555-5555-555555555555", "tae@example.com", "Passw0rd!"),
                new SeedUser("66666666-6666-6666-6666-666666666666", "minji@example.com", "Passw0rd!"),
                new SeedUser("77777777-7777-7777-7777-777777777777", "ryu@example.com", "Passw0rd!"),
                new SeedUser("88888888-8888-8888-8888-888888888888", "eun@example.com", "Passw0rd!"),
                new SeedUser("99999999-9999-9999-9999-999999999999", "lexi@example.com", "Passw0rd!"),
                new SeedUser("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "noa@example.com", "Passw0rd!")
        );
    }

    private record SeedUser(String userId, String email, String rawPassword) {
    }
}
