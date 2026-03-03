package com.example.auth.adapters.in.web;

import com.example.auth.adapters.in.web.dto.AuthResponse;
import com.example.auth.adapters.in.web.dto.LinkedProvidersResponse;
import com.example.auth.adapters.in.web.dto.OAuthLinkRequest;
import com.example.auth.application.port.out.OAuthClientPort;
import com.example.auth.application.security.JwtTokenService;
import com.example.auth.application.service.OAuthLinkingService;
import com.example.auth.application.service.OAuthLoginResult;
import com.example.auth.domain.IdentityProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/oauth")
public class OAuthController {
    private final OAuthLinkingService linkingService;
    private final OAuthClientPort oauthClient;
    private final JwtTokenService jwtTokenService;
    private final Clock clock;
    private final String googleRedirectUri;
    private final String appleRedirectUri;

    public OAuthController(OAuthLinkingService linkingService,
                           OAuthClientPort oauthClient,
                           JwtTokenService jwtTokenService,
                           Clock clock,
                           @Value("${auth.oauth.google.redirect-uri:}") String googleRedirectUri,
                           @Value("${auth.oauth.apple.redirect-uri:}") String appleRedirectUri) {
        this.linkingService = linkingService;
        this.oauthClient = oauthClient;
        this.jwtTokenService = jwtTokenService;
        this.clock = clock;
        this.googleRedirectUri = googleRedirectUri;
        this.appleRedirectUri = appleRedirectUri;
    }

    @GetMapping("/{provider}/authorize")
    public ResponseEntity<Void> authorize(@PathVariable("provider") IdentityProvider provider) {
        IdentityProvider oauthProvider = requireOAuth(provider);
        String state = UUID.randomUUID().toString();
        String redirectUri = resolveRedirectUri(oauthProvider);
        String authorizationUri = oauthClient.buildAuthorizationUri(oauthProvider, redirectUri, state);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(authorizationUri))
                .build();
    }

    @GetMapping("/{provider}/callback")
    public AuthResponse callback(@PathVariable("provider") IdentityProvider provider,
                                 @RequestParam String code,
                                 @RequestParam String state,
                                 HttpServletRequest request) {
        IdentityProvider oauthProvider = requireOAuth(provider);
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("OAuth code is required");
        }
        if (state == null || state.isBlank()) {
            throw new IllegalArgumentException("OAuth state is required");
        }
        OAuthLoginResult result = linkingService.loginWithProvider(
                oauthProvider,
                code,
                resolveRedirectUri(oauthProvider),
                request.getRemoteAddr(),
                request.getHeader("User-Agent"));
        return toResponse(result.userId(), result.tokens(), result.linkedProviders());
    }

    @PostMapping("/{provider}/link")
    public LinkedProvidersResponse link(@PathVariable("provider") IdentityProvider provider,
                                        @Valid @RequestBody OAuthLinkRequest request,
                                        @RequestParam(name = "access_token", required = false) String accessToken,
                                        HttpServletRequest httpRequest) {
        IdentityProvider oauthProvider = requireOAuth(provider);
        String tokenValue = resolveToken(httpRequest.getHeader(HttpHeaders.AUTHORIZATION), accessToken);
        UUID userId = extractUserId(tokenValue);
        List<IdentityProvider> linkedProviders = linkingService.linkProvider(
                userId,
                oauthProvider,
                request.code(),
                resolveRedirectUri(oauthProvider));
        return new LinkedProvidersResponse(userId, linkedProviders);
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

    private UUID extractUserId(String tokenValue) {
        JwtTokenService.DecodedToken decoded = jwtTokenService.decode(tokenValue);
        return UUID.fromString(decoded.subject());
    }

    private String resolveToken(String authorizationHeader, String accessTokenParam) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring("Bearer ".length());
        }
        if (accessTokenParam != null && !accessTokenParam.isBlank()) {
            return accessTokenParam;
        }
        throw new IllegalArgumentException("Authorization token required");
    }

    private AuthResponse toResponse(UUID userId,
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
