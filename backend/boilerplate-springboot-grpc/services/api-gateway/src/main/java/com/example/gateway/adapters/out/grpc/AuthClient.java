package com.example.gateway.adapters.out.grpc;

import com.example.auth.v1.AuthServiceGrpc;
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
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class AuthClient implements AuthClientPort {
    private final AuthServiceGrpc.AuthServiceBlockingStub stub;

    public AuthClient(AuthServiceGrpc.AuthServiceBlockingStub stub) {
        this.stub = stub;
    }

    @Override
    public SignupResponse signup(EmailSignupRequest request) {
        var response = stub.signupEmail(com.example.auth.v1.SignupEmailRequest.newBuilder()
                .setEmail(request.email())
                .setPassword(request.password())
                .build());
        return new SignupResponse(UUID.fromString(response.getUserId()), response.getStatus());
    }

    @Override
    public SignupResponse verify(EmailVerifyRequest request) {
        var response = stub.verifyEmail(com.example.auth.v1.VerifyEmailRequest.newBuilder()
                .setEmail(request.email())
                .setCode(request.code())
                .build());
        return new SignupResponse(UUID.fromString(response.getUserId()), response.getStatus());
    }

    @Override
    public EmailAvailabilityResponse checkEmail(EmailCheckRequest request) {
        var response = stub.checkEmail(com.example.auth.v1.CheckEmailRequest.newBuilder()
                .setEmail(request.email())
                .build());
        return new EmailAvailabilityResponse(response.getEmail(), response.getAvailable(), response.getStatus());
    }

    @Override
    public PasswordResetResponse requestPasswordReset(PasswordResetRequest request) {
        var response = stub.requestPasswordReset(com.example.auth.v1.RequestPasswordResetRequest.newBuilder()
                .setEmail(request.email())
                .build());
        return new PasswordResetResponse(response.getStatus());
    }

    @Override
    public PasswordResetResponse confirmPasswordReset(PasswordResetConfirmRequest request) {
        var response = stub.confirmPasswordReset(com.example.auth.v1.ConfirmPasswordResetRequest.newBuilder()
                .setToken(request.token())
                .setNewPassword(request.newPassword())
                .build());
        return new PasswordResetResponse(response.getStatus());
    }

    @Override
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        var grpcRequest = com.example.auth.v1.LoginEmailRequest.newBuilder()
                .setEmail(request.email())
                .setPassword(request.password());
        if (ipAddress != null && !ipAddress.isBlank()) {
            grpcRequest.setIpAddress(ipAddress);
        }
        if (userAgent != null && !userAgent.isBlank()) {
            grpcRequest.setUserAgent(userAgent);
        }
        var response = stub.loginEmail(grpcRequest.build());
        return toAuthResponse(response);
    }

    @Override
    public AuthResponse refresh(String refreshToken) {
        var response = stub.refreshTokens(com.example.auth.v1.RefreshTokensRequest.newBuilder()
                .setRefreshToken(refreshToken)
                .build());
        return toAuthResponse(response);
    }

    @Override
    public void logout(String refreshToken) {
        stub.logout(com.example.auth.v1.LogoutRequest.newBuilder()
                .setRefreshToken(refreshToken)
                .build());
    }

    @Override
    public URI authorize(IdentityProvider provider) {
        var response = stub.authorizeOAuth(com.example.auth.v1.AuthorizeOAuthRequest.newBuilder()
                .setProvider(toProtoProvider(provider))
                .build());
        return URI.create(response.getAuthorizationUri());
    }

    @Override
    public AuthResponse oauthCallback(IdentityProvider provider,
                                      String code,
                                      String state,
                                      String ipAddress,
                                      String userAgent) {
        var grpcRequest = com.example.auth.v1.OAuthCallbackRequest.newBuilder()
                .setProvider(toProtoProvider(provider))
                .setCode(code)
                .setState(state);
        if (ipAddress != null && !ipAddress.isBlank()) {
            grpcRequest.setIpAddress(ipAddress);
        }
        if (userAgent != null && !userAgent.isBlank()) {
            grpcRequest.setUserAgent(userAgent);
        }

        var response = stub.oAuthCallback(grpcRequest.build());
        return toAuthResponse(response);
    }

    @Override
    public LinkedProvidersResponse linkProvider(IdentityProvider provider,
                                                OAuthLinkRequest request,
                                                String userId) {
        var response = stub.linkOAuthProvider(com.example.auth.v1.LinkOAuthProviderRequest.newBuilder()
                .setProvider(toProtoProvider(provider))
                .setUserId(userId)
                .setCode(request.code())
                .setState(request.state())
                .build());
        List<IdentityProvider> providers = response.getProvidersList().stream().map(this::toDomainProvider).toList();
        return new LinkedProvidersResponse(UUID.fromString(response.getUserId()), providers);
    }

    private AuthResponse toAuthResponse(com.example.auth.v1.AuthResponse response) {
        List<IdentityProvider> linkedProviders = response.getLinkedProvidersList().stream()
                .map(this::toDomainProvider)
                .toList();
        return new AuthResponse(
                UUID.fromString(response.getUserId()),
                response.getAccessToken(),
                response.getRefreshToken(),
                response.getTokenType(),
                response.getExpiresInSeconds(),
                linkedProviders);
    }

    private com.example.auth.v1.IdentityProvider toProtoProvider(IdentityProvider provider) {
        return switch (provider) {
            case EMAIL -> com.example.auth.v1.IdentityProvider.EMAIL;
            case GOOGLE -> com.example.auth.v1.IdentityProvider.GOOGLE;
            case APPLE -> com.example.auth.v1.IdentityProvider.APPLE;
        };
    }

    private IdentityProvider toDomainProvider(com.example.auth.v1.IdentityProvider provider) {
        return switch (provider) {
            case EMAIL -> IdentityProvider.EMAIL;
            case GOOGLE -> IdentityProvider.GOOGLE;
            case APPLE -> IdentityProvider.APPLE;
            case IDENTITY_PROVIDER_UNSPECIFIED, UNRECOGNIZED ->
                    throw new IllegalArgumentException("Invalid identity provider");
        };
    }
}
