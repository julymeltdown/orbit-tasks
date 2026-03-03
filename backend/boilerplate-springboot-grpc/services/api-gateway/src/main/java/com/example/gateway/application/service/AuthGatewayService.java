package com.example.gateway.application.service;

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
import com.example.gateway.application.port.out.AuthClientPort;
import com.example.gateway.domain.IdentityProvider;
import java.net.URI;
import org.springframework.stereotype.Service;

@Service
public class AuthGatewayService {
    private final AuthClientPort authClient;

    public AuthGatewayService(AuthClientPort authClient) {
        this.authClient = authClient;
    }

    public SignupResponse signup(EmailSignupRequest request) {
        return authClient.signup(request);
    }

    public SignupResponse verify(EmailVerifyRequest request) {
        return authClient.verify(request);
    }

    public EmailAvailabilityResponse checkEmail(EmailCheckRequest request) {
        return authClient.checkEmail(request);
    }

    public PasswordResetResponse requestPasswordReset(PasswordResetRequest request) {
        return authClient.requestPasswordReset(request);
    }

    public PasswordResetResponse confirmPasswordReset(PasswordResetConfirmRequest request) {
        return authClient.confirmPasswordReset(request);
    }

    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        return authClient.login(request, ipAddress, userAgent);
    }

    public AuthResponse refresh(String refreshToken) {
        return authClient.refresh(refreshToken);
    }

    public void logout(String refreshToken) {
        authClient.logout(refreshToken);
    }

    public URI authorize(IdentityProvider provider) {
        return authClient.authorize(provider);
    }

    public AuthResponse oauthCallback(IdentityProvider provider,
                                      String code,
                                      String state,
                                      String ipAddress,
                                      String userAgent) {
        return authClient.oauthCallback(provider, code, state, ipAddress, userAgent);
    }

    public LinkedProvidersResponse linkProvider(IdentityProvider provider,
                                                OAuthLinkRequest request,
                                                String userId) {
        return authClient.linkProvider(provider, request, userId);
    }
}
