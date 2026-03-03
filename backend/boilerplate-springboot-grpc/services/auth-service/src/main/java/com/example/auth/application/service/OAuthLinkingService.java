package com.example.auth.application.service;

import com.example.auth.application.port.out.LoginAuditRepositoryPort;
import com.example.auth.application.port.out.OAuthClientPort;
import com.example.auth.application.port.out.OAuthUserInfo;
import com.example.auth.application.port.out.RefreshTokenRecord;
import com.example.auth.application.port.out.RefreshTokenStorePort;
import com.example.auth.application.port.out.UserRepositoryPort;
import com.example.auth.application.security.JwtTokenService;
import com.example.auth.application.validation.EmailValidator;
import com.example.auth.domain.IdentityProvider;
import com.example.auth.domain.LoginAudit;
import com.example.auth.domain.LoginMethod;
import com.example.auth.domain.User;
import com.example.auth.domain.UserIdentity;
import com.example.auth.domain.UserStatus;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class OAuthLinkingService {
    private final OAuthClientPort oauthClient;
    private final UserRepositoryPort userRepository;
    private final UserIdentityService identityService;
    private final JwtTokenService jwtTokenService;
    private final RefreshTokenStorePort refreshTokenStore;
    private final LoginAuditRepositoryPort loginAuditRepository;
    private final EmailValidator emailValidator;
    private final Clock clock;

    public OAuthLinkingService(OAuthClientPort oauthClient,
                               UserRepositoryPort userRepository,
                               UserIdentityService identityService,
                               JwtTokenService jwtTokenService,
                               RefreshTokenStorePort refreshTokenStore,
                               LoginAuditRepositoryPort loginAuditRepository,
                               EmailValidator emailValidator,
                               Clock clock) {
        this.oauthClient = oauthClient;
        this.userRepository = userRepository;
        this.identityService = identityService;
        this.jwtTokenService = jwtTokenService;
        this.refreshTokenStore = refreshTokenStore;
        this.loginAuditRepository = loginAuditRepository;
        this.emailValidator = emailValidator;
        this.clock = clock;
    }

    public OAuthLoginResult loginWithProvider(IdentityProvider provider,
                                              String code,
                                              String redirectUri,
                                              String ipAddress,
                                              String userAgent) {
        OAuthUserInfo userInfo = oauthClient.fetchUserInfo(provider, code, redirectUri);
        String email = normalize(userInfo.email());
        if (!email.isBlank() && !emailValidator.isValid(email)) {
            throw new IllegalArgumentException("Invalid email from provider");
        }

        Optional<UserIdentity> bySubject = identityService.findByProviderAndSubject(provider, userInfo.subject());
        if (bySubject.isPresent()) {
            UserIdentity identity = bySubject.get();
            User user = userRepository.findById(identity.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            validateActive(user);
            User updated = new User(user.getId(), user.getPrimaryEmail(), user.getPasswordHash(), user.getStatus(),
                    clock.instant());
            userRepository.save(updated);
            JwtTokenService.TokenPair tokens = issueTokens(user.getId());
            recordAudit(user.getId(), provider, ipAddress, userAgent, true);
            return new OAuthLoginResult(user.getId(), tokens, identityService.findLinkedProviders(user.getId()));
        }

        UserResolution resolution = resolveUserByEmail(email);
        User user = resolution.user();
        if (user == null) {
            UUID userId = UUID.randomUUID();
            UserStatus status = userInfo.emailVerified() ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION;
            user = new User(userId, email.isBlank() ? null : email, null, status, null);
        } else {
            validateActive(user);
            String primaryEmail = user.getPrimaryEmail();
            if ((primaryEmail == null || primaryEmail.isBlank()) && !email.isBlank()) {
                primaryEmail = email;
            }
            user = new User(user.getId(), primaryEmail, user.getPasswordHash(), user.getStatus(), clock.instant());
        }

        userRepository.save(user);
        identityService.linkOAuthIdentity(user.getId(), provider, userInfo.subject(), email, userInfo.emailVerified());
        JwtTokenService.TokenPair tokens = issueTokens(user.getId());
        recordAudit(user.getId(), provider, ipAddress, userAgent, true);
        return new OAuthLoginResult(user.getId(), tokens, identityService.findLinkedProviders(user.getId()));
    }

    public List<IdentityProvider> linkProvider(UUID userId,
                                               IdentityProvider provider,
                                               String code,
                                               String redirectUri) {
        OAuthUserInfo userInfo = oauthClient.fetchUserInfo(provider, code, redirectUri);
        String email = normalize(userInfo.email());
        if (!email.isBlank() && !emailValidator.isValid(email)) {
            throw new IllegalArgumentException("Invalid email from provider");
        }

        identityService.findByProviderAndSubject(provider, userInfo.subject())
                .ifPresent(identity -> {
                    if (!identity.getUserId().equals(userId)) {
                        throw new IllegalArgumentException("Provider already linked to another user");
                    }
                });

        if (!email.isBlank()) {
            List<UserIdentity> identities = identityService.findByEmail(email);
            boolean mismatched = identities.stream().anyMatch(identity -> !identity.getUserId().equals(userId));
            if (mismatched) {
                throw new IllegalArgumentException("Email already linked to another user");
            }
        }

        identityService.linkOAuthIdentity(userId, provider, userInfo.subject(), email, userInfo.emailVerified());
        return identityService.findLinkedProviders(userId);
    }

    private JwtTokenService.TokenPair issueTokens(UUID userId) {
        JwtTokenService.TokenPair tokens = jwtTokenService.issueTokenPair(userId.toString(), List.of("ROLE_USER"));
        RefreshTokenRecord record = new RefreshTokenRecord(
                tokens.refreshJti(),
                hashToken(tokens.refreshToken()),
                userId,
                tokens.refreshExpiresAt());
        refreshTokenStore.store(record);
        return tokens;
    }

    private void validateActive(User user) {
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("User not active");
        }
    }

    private void recordAudit(UUID userId,
                             IdentityProvider provider,
                             String ipAddress,
                             String userAgent,
                             boolean success) {
        LoginAudit audit = new LoginAudit(
                UUID.randomUUID(),
                userId,
                toLoginMethod(provider),
                ipAddress,
                userAgent,
                success,
                clock.instant());
        loginAuditRepository.save(audit);
    }

    private LoginMethod toLoginMethod(IdentityProvider provider) {
        return switch (provider) {
            case GOOGLE -> LoginMethod.GOOGLE;
            case APPLE -> LoginMethod.APPLE;
            default -> LoginMethod.EMAIL;
        };
    }

    private UserResolution resolveUserByEmail(String email) {
        if (email.isBlank()) {
            return new UserResolution(null, List.of());
        }
        List<UserIdentity> identities = identityService.findByEmail(email);
        if (identities.isEmpty()) {
            return new UserResolution(null, identities);
        }
        UUID userId = identities.get(0).getUserId();
        boolean mismatch = identities.stream().anyMatch(identity -> !identity.getUserId().equals(userId));
        if (mismatch) {
            throw new IllegalArgumentException("Email linked to multiple users");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found for identity"));
        return new UserResolution(user, identities);
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to hash token", ex);
        }
    }

    private record UserResolution(User user, List<UserIdentity> identities) {
    }
}
