package com.example.auth.adapters.in.grpc;

import com.example.auth.application.port.out.OAuthClientPort;
import com.example.auth.application.security.JwtTokenService;
import com.example.auth.application.service.AuthSession;
import com.example.auth.application.service.EmailAvailability;
import com.example.auth.application.service.LoginService;
import com.example.auth.application.service.OAuthLinkingService;
import com.example.auth.application.service.OAuthLoginResult;
import com.example.auth.application.service.PasswordResetService;
import com.example.auth.application.service.UserIdentityService;
import com.example.auth.application.service.UserRegistrationService;
import com.example.auth.domain.IdentityProvider;
import com.example.auth.v1.AuthResponse;
import com.example.auth.v1.AuthServiceGrpc;
import com.example.auth.v1.AuthorizeOAuthRequest;
import com.example.auth.v1.CheckEmailRequest;
import com.example.auth.v1.ConfirmPasswordResetRequest;
import com.example.auth.v1.EmailAvailabilityResponse;
import com.example.auth.v1.LinkOAuthProviderRequest;
import com.example.auth.v1.LinkedProvidersResponse;
import com.example.auth.v1.LoginEmailRequest;
import com.example.auth.v1.LogoutRequest;
import com.example.auth.v1.OAuthAuthorizeResponse;
import com.example.auth.v1.OAuthCallbackRequest;
import com.example.auth.v1.PasswordResetResponse;
import com.example.auth.v1.RefreshTokensRequest;
import com.example.auth.v1.RequestPasswordResetRequest;
import com.example.auth.v1.SignupEmailRequest;
import com.example.auth.v1.SignupResponse;
import com.example.auth.v1.VerifyEmailRequest;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class AuthGrpcService extends AuthServiceGrpc.AuthServiceImplBase {
    private final UserRegistrationService registrationService;
    private final LoginService loginService;
    private final UserIdentityService identityService;
    private final PasswordResetService passwordResetService;
    private final OAuthLinkingService linkingService;
    private final OAuthClientPort oauthClient;
    private final Clock clock;
    private final String googleRedirectUri;
    private final String appleRedirectUri;

    public AuthGrpcService(UserRegistrationService registrationService,
                           LoginService loginService,
                           UserIdentityService identityService,
                           PasswordResetService passwordResetService,
                           OAuthLinkingService linkingService,
                           OAuthClientPort oauthClient,
                           Clock clock,
                           @Value("${auth.oauth.google.redirect-uri:}") String googleRedirectUri,
                           @Value("${auth.oauth.apple.redirect-uri:}") String appleRedirectUri) {
        this.registrationService = registrationService;
        this.loginService = loginService;
        this.identityService = identityService;
        this.passwordResetService = passwordResetService;
        this.linkingService = linkingService;
        this.oauthClient = oauthClient;
        this.clock = clock;
        this.googleRedirectUri = googleRedirectUri;
        this.appleRedirectUri = appleRedirectUri;
    }

    @Override
    public void signupEmail(SignupEmailRequest request, StreamObserver<SignupResponse> responseObserver) {
        try {
            UUID userId = registrationService.registerEmail(request.getEmail(), request.getPassword());
            responseObserver.onNext(SignupResponse.newBuilder()
                    .setUserId(userId.toString())
                    .setStatus("PENDING_VERIFICATION")
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void verifyEmail(VerifyEmailRequest request, StreamObserver<SignupResponse> responseObserver) {
        try {
            UUID userId = registrationService.verifyEmail(request.getEmail(), request.getCode());
            responseObserver.onNext(SignupResponse.newBuilder()
                    .setUserId(userId.toString())
                    .setStatus("VERIFIED")
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void checkEmail(CheckEmailRequest request,
                           StreamObserver<EmailAvailabilityResponse> responseObserver) {
        try {
            EmailAvailability availability = registrationService.checkEmailAvailability(request.getEmail());
            responseObserver.onNext(EmailAvailabilityResponse.newBuilder()
                    .setEmail(availability.email())
                    .setAvailable(availability.available())
                    .setStatus(availability.status().name())
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void loginEmail(LoginEmailRequest request, StreamObserver<AuthResponse> responseObserver) {
        try {
            AuthSession session = loginService.loginWithEmail(
                    request.getEmail(),
                    request.getPassword(),
                    emptyToNull(request.getIpAddress()),
                    emptyToNull(request.getUserAgent()));
            List<IdentityProvider> linked = identityService.findLinkedProviders(session.userId());
            responseObserver.onNext(toAuthResponse(session.userId(), session.tokens(), linked));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void refreshTokens(RefreshTokensRequest request, StreamObserver<AuthResponse> responseObserver) {
        try {
            AuthSession session = loginService.refreshTokens(request.getRefreshToken());
            List<IdentityProvider> linked = identityService.findLinkedProviders(session.userId());
            responseObserver.onNext(toAuthResponse(session.userId(), session.tokens(), linked));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void logout(LogoutRequest request, StreamObserver<PasswordResetResponse> responseObserver) {
        try {
            loginService.logout(request.getRefreshToken());
            responseObserver.onNext(PasswordResetResponse.newBuilder().setStatus("LOGGED_OUT").build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void requestPasswordReset(RequestPasswordResetRequest request,
                                     StreamObserver<PasswordResetResponse> responseObserver) {
        try {
            passwordResetService.requestReset(request.getEmail());
            responseObserver.onNext(PasswordResetResponse.newBuilder().setStatus("SENT").build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void confirmPasswordReset(ConfirmPasswordResetRequest request,
                                     StreamObserver<PasswordResetResponse> responseObserver) {
        try {
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            responseObserver.onNext(PasswordResetResponse.newBuilder().setStatus("RESET").build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void authorizeOAuth(AuthorizeOAuthRequest request,
                               StreamObserver<OAuthAuthorizeResponse> responseObserver) {
        try {
            IdentityProvider provider = requireOAuth(toDomainProvider(request.getProvider()));
            String state = UUID.randomUUID().toString();
            String authorizationUri = oauthClient.buildAuthorizationUri(provider, resolveRedirectUri(provider), state);
            responseObserver.onNext(OAuthAuthorizeResponse.newBuilder()
                    .setAuthorizationUri(authorizationUri)
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void oAuthCallback(OAuthCallbackRequest request, StreamObserver<AuthResponse> responseObserver) {
        try {
            IdentityProvider provider = requireOAuth(toDomainProvider(request.getProvider()));
            String code = request.getCode();
            String state = request.getState();
            if (code == null || code.isBlank()) {
                throw new IllegalArgumentException("OAuth code is required");
            }
            if (state == null || state.isBlank()) {
                throw new IllegalArgumentException("OAuth state is required");
            }

            OAuthLoginResult result = linkingService.loginWithProvider(
                    provider,
                    code,
                    resolveRedirectUri(provider),
                    emptyToNull(request.getIpAddress()),
                    emptyToNull(request.getUserAgent()));

            responseObserver.onNext(toAuthResponse(result.userId(), result.tokens(), result.linkedProviders()));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    @Override
    public void linkOAuthProvider(LinkOAuthProviderRequest request,
                                  StreamObserver<LinkedProvidersResponse> responseObserver) {
        try {
            IdentityProvider provider = requireOAuth(toDomainProvider(request.getProvider()));
            UUID userId = parseUuid(request.getUserId(), "User ID");
            List<IdentityProvider> linkedProviders = linkingService.linkProvider(
                    userId,
                    provider,
                    request.getCode(),
                    resolveRedirectUri(provider));

            LinkedProvidersResponse.Builder builder = LinkedProvidersResponse.newBuilder()
                    .setUserId(userId.toString());
            linkedProviders.forEach(value -> builder.addProviders(toProtoProvider(value)));
            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondIllegal(responseObserver, ex);
        }
    }

    private AuthResponse toAuthResponse(UUID userId,
                                        JwtTokenService.TokenPair tokens,
                                        List<IdentityProvider> linkedProviders) {
        long expiresIn = Duration.between(clock.instant(), tokens.accessExpiresAt()).getSeconds();
        AuthResponse.Builder builder = AuthResponse.newBuilder()
                .setUserId(userId.toString())
                .setAccessToken(tokens.accessToken())
                .setRefreshToken(tokens.refreshToken())
                .setTokenType("Bearer")
                .setExpiresInSeconds(Math.max(expiresIn, 0));
        linkedProviders.forEach(provider -> builder.addLinkedProviders(toProtoProvider(provider)));
        return builder.build();
    }

    private IdentityProvider requireOAuth(IdentityProvider provider) {
        if (provider == IdentityProvider.EMAIL) {
            throw new IllegalArgumentException("OAuth provider required");
        }
        return provider;
    }

    private String resolveRedirectUri(IdentityProvider provider) {
        String redirectUri = switch (provider) {
            case GOOGLE -> googleRedirectUri;
            case APPLE -> appleRedirectUri;
            default -> "";
        };
        if (redirectUri == null || redirectUri.isBlank()) {
            throw new IllegalArgumentException("Redirect URI not configured");
        }
        return redirectUri;
    }

    private IdentityProvider toDomainProvider(com.example.auth.v1.IdentityProvider provider) {
        return switch (provider) {
            case EMAIL -> IdentityProvider.EMAIL;
            case GOOGLE -> IdentityProvider.GOOGLE;
            case APPLE -> IdentityProvider.APPLE;
            case UNRECOGNIZED, IDENTITY_PROVIDER_UNSPECIFIED ->
                    throw new IllegalArgumentException("Identity provider is required");
        };
    }

    private com.example.auth.v1.IdentityProvider toProtoProvider(IdentityProvider provider) {
        return switch (provider) {
            case EMAIL -> com.example.auth.v1.IdentityProvider.EMAIL;
            case GOOGLE -> com.example.auth.v1.IdentityProvider.GOOGLE;
            case APPLE -> com.example.auth.v1.IdentityProvider.APPLE;
        };
    }

    private UUID parseUuid(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " is required");
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(label + " must be a UUID");
        }
    }

    private void respondIllegal(StreamObserver<?> responseObserver, IllegalArgumentException ex) {
        String message = ex.getMessage() == null ? "Invalid request" : ex.getMessage();
        String lowered = message.toLowerCase(Locale.ROOT);

        Status status;
        if (lowered.contains("invalid credentials")
                || lowered.contains("refresh token")
                || lowered.contains("authorization token")) {
            status = Status.UNAUTHENTICATED;
        } else if (lowered.contains("already") && (lowered.contains("registered") || lowered.contains("linked"))) {
            status = Status.ALREADY_EXISTS;
        } else if (lowered.contains("not found")) {
            status = Status.NOT_FOUND;
        } else if (lowered.contains("not active")) {
            status = Status.FAILED_PRECONDITION;
        } else {
            status = Status.INVALID_ARGUMENT;
        }

        responseObserver.onError(status.withDescription(message).asRuntimeException());
    }

    private String emptyToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }
}
