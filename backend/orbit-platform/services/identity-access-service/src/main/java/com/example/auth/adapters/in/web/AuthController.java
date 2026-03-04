package com.example.auth.adapters.in.web;

import com.example.auth.adapters.in.web.dto.AuthResponse;
import com.example.auth.adapters.in.web.dto.EmailAvailabilityResponse;
import com.example.auth.adapters.in.web.dto.EmailCheckRequest;
import com.example.auth.adapters.in.web.dto.EmailSignupRequest;
import com.example.auth.adapters.in.web.dto.EmailVerifyRequest;
import com.example.auth.adapters.in.web.dto.LoginRequest;
import com.example.auth.adapters.in.web.dto.LogoutRequest;
import com.example.auth.adapters.in.web.dto.PasswordResetConfirmRequest;
import com.example.auth.adapters.in.web.dto.PasswordResetRequest;
import com.example.auth.adapters.in.web.dto.PasswordResetResponse;
import com.example.auth.adapters.in.web.dto.RefreshRequest;
import com.example.auth.adapters.in.web.dto.SignupResponse;
import com.example.auth.application.security.JwtTokenService;
import com.example.auth.application.service.EmailAvailability;
import com.example.auth.application.service.AuthSession;
import com.example.auth.application.service.LoginService;
import com.example.auth.application.service.PasswordResetService;
import com.example.auth.application.service.UserIdentityService;
import com.example.auth.application.service.UserRegistrationService;
import com.example.auth.domain.IdentityProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final UserRegistrationService registrationService;
    private final LoginService loginService;
    private final UserIdentityService identityService;
    private final PasswordResetService passwordResetService;
    private final Clock clock;

    public AuthController(UserRegistrationService registrationService,
                          LoginService loginService,
                          UserIdentityService identityService,
                          PasswordResetService passwordResetService,
                          Clock clock) {
        this.registrationService = registrationService;
        this.loginService = loginService;
        this.identityService = identityService;
        this.passwordResetService = passwordResetService;
        this.clock = clock;
    }

    @PostMapping("/email/signup")
    public SignupResponse signup(@Valid @RequestBody EmailSignupRequest request) {
        return new SignupResponse(
                registrationService.registerEmail(request.email(), request.password(), request.workspaceName()),
                "PENDING_VERIFICATION");
    }

    @PostMapping("/email/verify")
    public SignupResponse verify(@Valid @RequestBody EmailVerifyRequest request) {
        return new SignupResponse(
                registrationService.verifyEmail(request.email(), request.code()),
                "VERIFIED");
    }

    @PostMapping("/email/check")
    public EmailAvailabilityResponse checkEmail(@Valid @RequestBody EmailCheckRequest request) {
        EmailAvailability availability = registrationService.checkEmailAvailability(request.email());
        return new EmailAvailabilityResponse(
                availability.email(),
                availability.available(),
                availability.status().name());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        AuthSession session = loginService.loginWithEmail(
                request.email(),
                request.password(),
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent"));
        List<IdentityProvider> linkedProviders = identityService.findLinkedProviders(session.userId());
        return toResponse(session.userId(), session.tokens(), linkedProviders);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        AuthSession session = loginService.refreshTokens(request.refreshToken());
        List<IdentityProvider> linkedProviders = identityService.findLinkedProviders(session.userId());
        return toResponse(session.userId(), session.tokens(), linkedProviders);
    }

    @PostMapping("/logout")
    public void logout(@Valid @RequestBody LogoutRequest request) {
        loginService.logout(request.refreshToken());
    }

    @PostMapping("/password/reset/request")
    public PasswordResetResponse requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.requestReset(request.email());
        return new PasswordResetResponse("SENT");
    }

    @PostMapping("/password/reset/confirm")
    public PasswordResetResponse confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return new PasswordResetResponse("RESET");
    }

    private AuthResponse toResponse(
            java.util.UUID userId,
            JwtTokenService.TokenPair tokens,
            List<IdentityProvider> linkedProviders) {
        long expiresIn = Duration.between(clock.instant(), tokens.accessExpiresAt()).getSeconds();
        return new AuthResponse(userId,
                tokens.accessToken(),
                tokens.refreshToken(),
                "Bearer",
                Math.max(expiresIn, 0),
                linkedProviders);
    }
}
