package com.example.auth.application.service;

import com.example.auth.application.port.out.LoginAuditRepositoryPort;
import com.example.auth.application.port.out.OAuthClientPort;
import com.example.auth.application.port.out.OAuthUserInfo;
import com.example.auth.application.port.out.RefreshTokenRecord;
import com.example.auth.application.port.out.RefreshTokenStorePort;
import com.example.auth.application.port.out.UserIdentityRepositoryPort;
import com.example.auth.application.port.out.UserRepositoryPort;
import com.example.auth.application.security.JwtTokenService;
import com.example.auth.application.validation.EmailValidator;
import com.example.auth.domain.IdentityProvider;
import com.example.auth.domain.LoginAudit;
import com.example.auth.domain.User;
import com.example.auth.domain.UserIdentity;
import com.example.auth.domain.UserStatus;
import java.security.KeyPairGenerator;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OAuthLinkingServiceTest {
    private InMemoryUserRepository userRepository;
    private InMemoryUserIdentityRepository identityRepository;
    private UserIdentityService identityService;
    private StubOAuthClient oauthClient;
    private StubRefreshTokenStore refreshTokenStore;
    private StubLoginAuditRepository auditRepository;
    private JwtTokenService jwtTokenService;
    private OAuthLinkingService service;

    @BeforeEach
    void setup() throws Exception {
        userRepository = new InMemoryUserRepository();
        identityRepository = new InMemoryUserIdentityRepository();
        identityService = new UserIdentityService(identityRepository, Clock.systemUTC());
        oauthClient = new StubOAuthClient();
        refreshTokenStore = new StubRefreshTokenStore();
        auditRepository = new StubLoginAuditRepository();
        EmailValidator emailValidator = new EmailValidator();
        Clock clock = Clock.fixed(Instant.parse("2025-01-01T00:00:00Z"), ZoneOffset.UTC);
        jwtTokenService = new JwtTokenService("issuer", Duration.ofMinutes(10), Duration.ofDays(14),
                KeyPairGenerator.getInstance("RSA").generateKeyPair(), clock);
        service = new OAuthLinkingService(
                oauthClient,
                userRepository,
                identityService,
                jwtTokenService,
                refreshTokenStore,
                auditRepository,
                emailValidator,
                clock);
    }

    @Test
    void loginWithProvider_existingSubjectUsesExistingUser() {
        UUID userId = UUID.randomUUID();
        userRepository.save(new User(userId, "user@example.com", null, UserStatus.ACTIVE, null));
        identityService.linkOAuthIdentity(userId, IdentityProvider.GOOGLE, "google-sub", "user@example.com", true);

        oauthClient.putUserInfo(IdentityProvider.GOOGLE, new OAuthUserInfo(
                IdentityProvider.GOOGLE,
                "google-sub",
                "user@example.com",
                true,
                Map.of("sub", "google-sub")));

        OAuthLoginResult result = service.loginWithProvider(
                IdentityProvider.GOOGLE,
                "code",
                "https://localhost/callback",
                "127.0.0.1",
                "agent");

        Assertions.assertThat(result.userId()).isEqualTo(userId);
        Assertions.assertThat(result.linkedProviders()).contains(IdentityProvider.GOOGLE);
        Assertions.assertThat(result.tokens().accessToken()).isNotBlank();
        Assertions.assertThat(refreshTokenStore.records).isNotEmpty();
    }

    @Test
    void loginWithProvider_emailMatchLinksProvider() {
        UUID userId = UUID.randomUUID();
        userRepository.save(new User(userId, "user@example.com", null, UserStatus.ACTIVE, null));
        identityService.linkEmailIdentity(userId, "user@example.com", true);

        oauthClient.putUserInfo(IdentityProvider.GOOGLE, new OAuthUserInfo(
                IdentityProvider.GOOGLE,
                "google-sub",
                "user@example.com",
                true,
                Map.of("sub", "google-sub")));

        OAuthLoginResult result = service.loginWithProvider(
                IdentityProvider.GOOGLE,
                "code",
                "https://localhost/callback",
                "127.0.0.1",
                "agent");

        Assertions.assertThat(result.linkedProviders()).contains(IdentityProvider.EMAIL, IdentityProvider.GOOGLE);
        Assertions.assertThat(identityService.findByProviderAndSubject(IdentityProvider.GOOGLE, "google-sub"))
                .isPresent();
    }

    @Test
    void loginWithProvider_createsNewUserWhenNoMatch() {
        oauthClient.putUserInfo(IdentityProvider.APPLE, new OAuthUserInfo(
                IdentityProvider.APPLE,
                "apple-sub",
                "new@example.com",
                true,
                Map.of("sub", "apple-sub")));

        OAuthLoginResult result = service.loginWithProvider(
                IdentityProvider.APPLE,
                "code",
                "https://localhost/callback",
                "127.0.0.1",
                "agent");

        Assertions.assertThat(result.userId()).isNotNull();
        Assertions.assertThat(userRepository.findById(result.userId())).isPresent();
        Assertions.assertThat(result.linkedProviders()).contains(IdentityProvider.APPLE);
    }

    private static class InMemoryUserRepository implements UserRepositoryPort {
        private final Map<UUID, User> store = new HashMap<>();

        @Override
        public Optional<User> findById(UUID id) {
            return Optional.ofNullable(store.get(id));
        }

        @Override
        public Optional<User> findByPrimaryEmail(String email) {
            return store.values().stream()
                    .filter(user -> email.equalsIgnoreCase(user.getPrimaryEmail()))
                    .findFirst();
        }

        @Override
        public User save(User user) {
            store.put(user.getId(), user);
            return user;
        }
    }

    private static class InMemoryUserIdentityRepository implements UserIdentityRepositoryPort {
        private final Map<UUID, UserIdentity> store = new HashMap<>();

        @Override
        public Optional<UserIdentity> findByProviderAndSubject(IdentityProvider providerType, String providerSubject) {
            return store.values().stream()
                    .filter(identity -> identity.getProviderType() == providerType)
                    .filter(identity -> providerSubject != null && providerSubject.equals(identity.getProviderSubject()))
                    .findFirst();
        }

        @Override
        public Optional<UserIdentity> findByProviderAndEmail(IdentityProvider providerType, String email) {
            return store.values().stream()
                    .filter(identity -> identity.getProviderType() == providerType)
                    .filter(identity -> email.equalsIgnoreCase(identity.getEmail()))
                    .findFirst();
        }

        @Override
        public List<UserIdentity> findByEmail(String email) {
            List<UserIdentity> results = new ArrayList<>();
            for (UserIdentity identity : store.values()) {
                if (email.equalsIgnoreCase(identity.getEmail())) {
                    results.add(identity);
                }
            }
            return results;
        }

        @Override
        public List<UserIdentity> findByUserId(UUID userId) {
            List<UserIdentity> results = new ArrayList<>();
            for (UserIdentity identity : store.values()) {
                if (identity.getUserId().equals(userId)) {
                    results.add(identity);
                }
            }
            return results;
        }

        @Override
        public UserIdentity save(UserIdentity identity) {
            store.put(identity.getId(), identity);
            return identity;
        }
    }

    private static class StubOAuthClient implements OAuthClientPort {
        private final Map<IdentityProvider, OAuthUserInfo> userInfo = new HashMap<>();

        @Override
        public OAuthUserInfo fetchUserInfo(IdentityProvider provider, String code, String redirectUri) {
            OAuthUserInfo info = userInfo.get(provider);
            if (info == null) {
                throw new IllegalArgumentException("Missing stub user info");
            }
            return info;
        }

        @Override
        public String buildAuthorizationUri(IdentityProvider provider, String redirectUri, String state) {
            return "https://example.com/oauth?state=" + state;
        }

        void putUserInfo(IdentityProvider provider, OAuthUserInfo info) {
            userInfo.put(provider, info);
        }
    }

    private static class StubRefreshTokenStore implements RefreshTokenStorePort {
        private final Map<String, RefreshTokenRecord> records = new HashMap<>();

        @Override
        public void store(RefreshTokenRecord record) {
            records.put(record.jti(), record);
        }

        @Override
        public Optional<RefreshTokenRecord> find(String jti) {
            return Optional.ofNullable(records.get(jti));
        }

        @Override
        public boolean rotate(String currentJti, String currentTokenHash, RefreshTokenRecord nextRecord) {
            records.remove(currentJti);
            records.put(nextRecord.jti(), nextRecord);
            return true;
        }

        @Override
        public void revoke(String jti) {
            records.remove(jti);
        }

        @Override
        public boolean isUsed(String jti) {
            return false;
        }
    }

    private static class StubLoginAuditRepository implements LoginAuditRepositoryPort {
        private final List<LoginAudit> audits = new ArrayList<>();

        @Override
        public LoginAudit save(LoginAudit audit) {
            audits.add(audit);
            return audit;
        }
    }
}
