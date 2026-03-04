package com.example.auth.application.service;

import com.example.auth.application.port.out.UserRepositoryPort;
import com.example.auth.application.validation.EmailValidator;
import com.example.auth.domain.EmailVerification;
import com.example.auth.domain.IdentityProvider;
import com.example.auth.domain.User;
import com.example.auth.domain.UserIdentity;
import com.example.auth.domain.UserStatus;
import com.orbit.identity.application.service.WorkspaceProvisioningService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserRegistrationService {
    private final UserRepositoryPort userRepository;
    private final UserIdentityService identityService;
    private final EmailVerificationService verificationService;
    private final EmailValidator emailValidator;
    private final PasswordEncoder passwordEncoder;
    private final WorkspaceProvisioningService workspaceProvisioningService;
    private final Clock clock;

    public UserRegistrationService(UserRepositoryPort userRepository,
                                   UserIdentityService identityService,
                                   EmailVerificationService verificationService,
                                   EmailValidator emailValidator,
                                   PasswordEncoder passwordEncoder,
                                   WorkspaceProvisioningService workspaceProvisioningService,
                                   Clock clock) {
        this.userRepository = userRepository;
        this.identityService = identityService;
        this.verificationService = verificationService;
        this.emailValidator = emailValidator;
        this.passwordEncoder = passwordEncoder;
        this.workspaceProvisioningService = workspaceProvisioningService;
        this.clock = clock;
    }

    public UUID registerEmail(String email, String rawPassword) {
        return registerEmail(email, rawPassword, "Default Workspace");
    }

    public UUID registerEmail(String email, String rawPassword, String workspaceName) {
        String normalizedEmail = normalize(email);
        if (!emailValidator.isValid(normalizedEmail)) {
            throw new IllegalArgumentException("Invalid email format or domain");
        }
        if (identityService.findByProviderAndEmail(IdentityProvider.EMAIL, normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        Optional<User> existingByPrimary = userRepository.findByPrimaryEmail(normalizedEmail);
        List<UserIdentity> emailIdentities = identityService.findByEmail(normalizedEmail);
        Optional<User> existingUser = resolveUser(existingByPrimary, emailIdentities);
        UUID userId = existingUser.map(User::getId).orElse(UUID.randomUUID());
        UserStatus status = existingUser.map(User::getStatus).orElse(UserStatus.PENDING_VERIFICATION);
        Instant lastLoginAt = existingUser.map(User::getLastLoginAt).orElse(null);
        String passwordHash = passwordEncoder.encode(rawPassword);
        String primaryEmail = existingUser.map(User::getPrimaryEmail).orElse(normalizedEmail);

        User user = new User(userId, primaryEmail, passwordHash, status, lastLoginAt);
        userRepository.save(user);

        identityService.linkEmailIdentity(userId, normalizedEmail, false);
        workspaceProvisioningService.ensureDefaultWorkspace(userId, normalizeWorkspaceName(workspaceName));

        verificationService.createVerification(normalizedEmail, userId);
        return userId;
    }

    public UUID verifyEmail(String email, String code) {
        String normalizedEmail = normalize(email);
        EmailVerification verification = verificationService.verifyCode(normalizedEmail, code)
                .orElseThrow(() -> new IllegalArgumentException("Verification failed"));
        if (verification.getUserId() == null) {
            throw new IllegalArgumentException("User not found for verification");
        }
        UUID userId = verification.getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        UserStatus nextStatus = user.getStatus() == UserStatus.PENDING_VERIFICATION
                ? UserStatus.ACTIVE
                : user.getStatus();
        User updated = new User(user.getId(), user.getPrimaryEmail(), user.getPasswordHash(), nextStatus,
                user.getLastLoginAt());
        userRepository.save(updated);
        identityService.markEmailVerified(userId, normalizedEmail);

        return userId;
    }

    public EmailAvailability checkEmailAvailability(String email) {
        String normalizedEmail = normalize(email);
        if (!emailValidator.isValid(normalizedEmail)) {
            return EmailAvailability.invalid(normalizedEmail);
        }
        boolean hasIdentity = !identityService.findByEmail(normalizedEmail).isEmpty();
        boolean hasPrimary = userRepository.findByPrimaryEmail(normalizedEmail).isPresent();
        if (hasIdentity || hasPrimary) {
            return EmailAvailability.taken(normalizedEmail);
        }
        return EmailAvailability.available(normalizedEmail);
    }

    private Optional<User> resolveUser(Optional<User> existingByPrimary, List<UserIdentity> identities) {
        if (identities.isEmpty()) {
            return existingByPrimary;
        }
        UUID userId = identities.get(0).getUserId();
        boolean mismatch = identities.stream().anyMatch(identity -> !identity.getUserId().equals(userId));
        if (mismatch) {
            throw new IllegalArgumentException("Email linked to multiple users");
        }
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            throw new IllegalArgumentException("User not found for identity");
        }
        if (existingByPrimary.isPresent() && !existingByPrimary.get().getId().equals(userId)) {
            throw new IllegalArgumentException("Email already linked to another user");
        }
        return user;
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeWorkspaceName(String workspaceName) {
        String normalized = workspaceName == null ? "" : workspaceName.trim();
        if (normalized.isEmpty()) {
            return "Default Workspace";
        }
        return normalized;
    }
}
