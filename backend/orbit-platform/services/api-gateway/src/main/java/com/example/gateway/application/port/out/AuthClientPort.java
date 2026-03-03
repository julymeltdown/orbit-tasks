package com.example.gateway.application.port.out;

import com.example.gateway.application.dto.AuthResponse;
import com.example.gateway.application.dto.EmailAvailabilityResponse;
import com.example.gateway.application.dto.EmailCheckRequest;
import com.example.gateway.application.dto.EmailSignupRequest;
import com.example.gateway.application.dto.EmailVerifyRequest;
import com.example.gateway.application.dto.LinkedProvidersResponse;
import com.example.gateway.application.dto.LoginRequest;
import com.example.gateway.application.dto.OAuthLinkRequest;
import com.example.gateway.application.dto.PasswordResetConfirmRequest;
import com.example.gateway.application.dto.PasswordResetRequest;
import com.example.gateway.application.dto.PasswordResetResponse;
import com.example.gateway.application.dto.SignupResponse;
import com.example.gateway.application.dto.WorkspaceClaimResponse;
import com.example.gateway.domain.IdentityProvider;
import java.net.URI;
import java.util.List;
import java.util.UUID;

public interface AuthClientPort {
    SignupResponse signup(EmailSignupRequest request);

    SignupResponse verify(EmailVerifyRequest request);

    EmailAvailabilityResponse checkEmail(EmailCheckRequest request);

    PasswordResetResponse requestPasswordReset(PasswordResetRequest request);

    PasswordResetResponse confirmPasswordReset(PasswordResetConfirmRequest request);

    AuthResponse login(LoginRequest request, String ipAddress, String userAgent);

    AuthResponse refresh(String refreshToken);

    void logout(String refreshToken);

    URI authorize(IdentityProvider provider);

    AuthResponse oauthCallback(IdentityProvider provider,
                               String code,
                               String state,
                               String ipAddress,
                               String userAgent);

    LinkedProvidersResponse linkProvider(IdentityProvider provider, OAuthLinkRequest request, String userId);

    List<WorkspaceClaimResponse> listWorkspaceClaims(UUID userId);
}
