package com.example.auth.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.auth.application.port.out.UserRepositoryPort;
import com.example.auth.application.validation.EmailValidator;
import com.example.auth.domain.IdentityProvider;
import com.example.auth.domain.User;
import com.example.auth.domain.UserIdentity;
import com.example.auth.domain.UserStatus;
import com.orbit.identity.application.service.WorkspaceProvisioningService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class UserRegistrationServiceTest {

    @Test
    void reportsAvailableWhenEmailUnusedAndValid() {
        UserRepositoryPort userRepository = mock(UserRepositoryPort.class);
        UserIdentityService identityService = mock(UserIdentityService.class);
        EmailVerificationService verificationService = mock(EmailVerificationService.class);
        EmailValidator emailValidator = mock(EmailValidator.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        WorkspaceProvisioningService workspaceProvisioningService = mock(WorkspaceProvisioningService.class);

        when(emailValidator.isValid("test@example.com")).thenReturn(true);
        when(identityService.findByEmail("test@example.com")).thenReturn(List.of());
        when(userRepository.findByPrimaryEmail("test@example.com")).thenReturn(Optional.empty());

        UserRegistrationService service = new UserRegistrationService(
                userRepository,
                identityService,
                verificationService,
                emailValidator,
                passwordEncoder,
                workspaceProvisioningService,
                Clock.systemUTC());

        EmailAvailability availability = service.checkEmailAvailability("Test@Example.com");

        assertThat(availability.email()).isEqualTo("test@example.com");
        assertThat(availability.available()).isTrue();
        assertThat(availability.status()).isEqualTo(EmailAvailabilityStatus.AVAILABLE);
    }

    @Test
    void reportsTakenWhenIdentityExists() {
        UserRepositoryPort userRepository = mock(UserRepositoryPort.class);
        UserIdentityService identityService = mock(UserIdentityService.class);
        EmailVerificationService verificationService = mock(EmailVerificationService.class);
        EmailValidator emailValidator = mock(EmailValidator.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        WorkspaceProvisioningService workspaceProvisioningService = mock(WorkspaceProvisioningService.class);

        when(emailValidator.isValid("taken@example.com")).thenReturn(true);
        when(identityService.findByEmail("taken@example.com"))
                .thenReturn(List.of(new UserIdentity(
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        IdentityProvider.EMAIL,
                        null,
                        "taken@example.com",
                        true,
                        Instant.now())));
        when(userRepository.findByPrimaryEmail("taken@example.com")).thenReturn(Optional.empty());

        UserRegistrationService service = new UserRegistrationService(
                userRepository,
                identityService,
                verificationService,
                emailValidator,
                passwordEncoder,
                workspaceProvisioningService,
                Clock.systemUTC());

        EmailAvailability availability = service.checkEmailAvailability("taken@example.com");

        assertThat(availability.available()).isFalse();
        assertThat(availability.status()).isEqualTo(EmailAvailabilityStatus.TAKEN);
    }

    @Test
    void reportsTakenWhenPrimaryEmailExists() {
        UserRepositoryPort userRepository = mock(UserRepositoryPort.class);
        UserIdentityService identityService = mock(UserIdentityService.class);
        EmailVerificationService verificationService = mock(EmailVerificationService.class);
        EmailValidator emailValidator = mock(EmailValidator.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        WorkspaceProvisioningService workspaceProvisioningService = mock(WorkspaceProvisioningService.class);

        when(emailValidator.isValid("primary@example.com")).thenReturn(true);
        when(identityService.findByEmail("primary@example.com")).thenReturn(List.of());
        when(userRepository.findByPrimaryEmail("primary@example.com"))
                .thenReturn(Optional.of(new User(
                        UUID.randomUUID(),
                        "primary@example.com",
                        "hash",
                        UserStatus.ACTIVE,
                        null)));

        UserRegistrationService service = new UserRegistrationService(
                userRepository,
                identityService,
                verificationService,
                emailValidator,
                passwordEncoder,
                workspaceProvisioningService,
                Clock.systemUTC());

        EmailAvailability availability = service.checkEmailAvailability("primary@example.com");

        assertThat(availability.available()).isFalse();
        assertThat(availability.status()).isEqualTo(EmailAvailabilityStatus.TAKEN);
    }

    @Test
    void reportsInvalidWhenValidatorRejects() {
        UserRepositoryPort userRepository = mock(UserRepositoryPort.class);
        UserIdentityService identityService = mock(UserIdentityService.class);
        EmailVerificationService verificationService = mock(EmailVerificationService.class);
        EmailValidator emailValidator = mock(EmailValidator.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        WorkspaceProvisioningService workspaceProvisioningService = mock(WorkspaceProvisioningService.class);

        when(emailValidator.isValid("bad@example.com")).thenReturn(false);

        UserRegistrationService service = new UserRegistrationService(
                userRepository,
                identityService,
                verificationService,
                emailValidator,
                passwordEncoder,
                workspaceProvisioningService,
                Clock.systemUTC());

        EmailAvailability availability = service.checkEmailAvailability("bad@example.com");

        assertThat(availability.available()).isFalse();
        assertThat(availability.status()).isEqualTo(EmailAvailabilityStatus.INVALID);
    }

    @Test
    void createsDefaultWorkspacePolicyOnSignup() {
        UserRepositoryPort userRepository = mock(UserRepositoryPort.class);
        UserIdentityService identityService = mock(UserIdentityService.class);
        EmailVerificationService verificationService = mock(EmailVerificationService.class);
        EmailValidator emailValidator = mock(EmailValidator.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        WorkspaceProvisioningService workspaceProvisioningService = mock(WorkspaceProvisioningService.class);

        when(emailValidator.isValid("new-user@example.com")).thenReturn(true);
        when(identityService.findByProviderAndEmail(IdentityProvider.EMAIL, "new-user@example.com"))
                .thenReturn(Optional.empty());
        when(userRepository.findByPrimaryEmail("new-user@example.com")).thenReturn(Optional.empty());
        when(identityService.findByEmail("new-user@example.com")).thenReturn(List.of());
        when(passwordEncoder.encode("Password123!")).thenReturn("encoded");

        UserRegistrationService service = new UserRegistrationService(
                userRepository,
                identityService,
                verificationService,
                emailValidator,
                passwordEncoder,
                workspaceProvisioningService,
                Clock.systemUTC());

        UUID userId = service.registerEmail("new-user@example.com", "Password123!");

        verify(workspaceProvisioningService).ensureDefaultWorkspace(userId);
    }
}
