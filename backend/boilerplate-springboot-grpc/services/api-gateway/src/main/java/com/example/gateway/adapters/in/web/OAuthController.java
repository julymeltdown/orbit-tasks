package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.AuthResponse;
import com.example.gateway.application.dto.LinkedProvidersResponse;
import com.example.gateway.application.dto.OAuthLinkRequest;
import com.example.gateway.application.service.AuthGatewayService;
import com.example.gateway.domain.IdentityProvider;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth/oauth")
public class OAuthController {
    private final AuthGatewayService authService;
    private final String refreshCookieName;
    private final String refreshCookieDomain;
    private final boolean refreshCookieSecure;
    private final Duration refreshCookieMaxAge;

    public OAuthController(AuthGatewayService authService,
                           @Value("${gateway.auth.refresh-cookie-name}") String refreshCookieName,
                           @Value("${gateway.auth.refresh-cookie-domain}") String refreshCookieDomain,
                           @Value("${gateway.auth.refresh-cookie-secure}") boolean refreshCookieSecure,
                           @Value("${gateway.auth.refresh-cookie-max-age}") Duration refreshCookieMaxAge) {
        this.authService = authService;
        this.refreshCookieName = refreshCookieName;
        this.refreshCookieDomain = refreshCookieDomain;
        this.refreshCookieSecure = refreshCookieSecure;
        this.refreshCookieMaxAge = refreshCookieMaxAge;
    }

    @GetMapping("/{provider}/authorize")
    public ResponseEntity<Void> authorize(@PathVariable String provider) {
        IdentityProvider identityProvider = parseProvider(provider);
        URI location = authService.authorize(identityProvider);
        String state = extractQueryParam(location, "state");
        if (state == null || state.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OAuth state missing from authorization URI");
        }
        return ResponseEntity.status(302)
                .location(location)
                .header(HttpHeaders.SET_COOKIE, buildOAuthStateCookie(identityProvider, state).toString())
                .build();
    }

    @GetMapping("/{provider}/callback")
    public ResponseEntity<AuthResponse> callback(@PathVariable String provider,
                                                 @RequestParam String code,
                                                 @RequestParam String state,
                                                 HttpServletRequest request) {
        IdentityProvider identityProvider = parseProvider(provider);
        verifyOAuthState(identityProvider, state, request);

        AuthResponse response = authService.oauthCallback(
                identityProvider,
                code,
                state,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(response.refreshToken()).toString())
                .header(HttpHeaders.SET_COOKIE, clearOAuthStateCookie(identityProvider).toString())
                .body(stripRefreshToken(response));
    }

    @PostMapping("/{provider}/link")
    public ResponseEntity<LinkedProvidersResponse> link(@PathVariable String provider,
                                                        @Valid @RequestBody OAuthLinkRequest request,
                                                        JwtAuthenticationToken authentication,
                                                        HttpServletRequest httpRequest) {
        IdentityProvider identityProvider = parseProvider(provider);
        verifyOAuthState(identityProvider, request.state(), httpRequest);

        String userId = authentication.getName();
        if (!StringUtils.hasText(userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authenticated user");
        }

        LinkedProvidersResponse response = authService.linkProvider(identityProvider, request, userId);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearOAuthStateCookie(identityProvider).toString())
                .body(response);
    }

    private IdentityProvider parseProvider(String provider) {
        return IdentityProvider.valueOf(provider.toUpperCase());
    }

    private AuthResponse stripRefreshToken(AuthResponse response) {
        return new AuthResponse(
                response.userId(),
                response.accessToken(),
                "",
                response.tokenType(),
                response.expiresIn(),
                response.linkedProviders());
    }

    private ResponseCookie buildRefreshCookie(String refreshToken) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(refreshCookieName, refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path("/")
                .sameSite("Lax")
                .maxAge(refreshCookieMaxAge);
        if (refreshCookieDomain != null && !refreshCookieDomain.isBlank()) {
            builder.domain(refreshCookieDomain);
        }
        return builder.build();
    }

    private void verifyOAuthState(IdentityProvider provider, String state, HttpServletRequest request) {
        if (state == null || state.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OAuth state is required");
        }
        String cookieValue = resolveCookie(request, oauthStateCookieName(provider));
        if (cookieValue == null || cookieValue.isBlank() || !Objects.equals(cookieValue, state)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OAuth state");
        }
    }

    private ResponseCookie buildOAuthStateCookie(IdentityProvider provider, String state) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(oauthStateCookieName(provider), state)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                // Must be sent for proxied paths like /gateway/auth/oauth/... in the frontend.
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofMinutes(10));
        if (refreshCookieDomain != null && !refreshCookieDomain.isBlank()) {
            builder.domain(refreshCookieDomain);
        }
        return builder.build();
    }

    private ResponseCookie clearOAuthStateCookie(IdentityProvider provider) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(oauthStateCookieName(provider), "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ZERO);
        if (refreshCookieDomain != null && !refreshCookieDomain.isBlank()) {
            builder.domain(refreshCookieDomain);
        }
        return builder.build();
    }

    private String oauthStateCookieName(IdentityProvider provider) {
        return "oauth_state_" + provider.name().toLowerCase();
    }

    private String resolveCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (var cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private String extractQueryParam(URI uri, String key) {
        if (uri == null || uri.getQuery() == null || uri.getQuery().isBlank()) {
            return null;
        }
        for (String pair : uri.getQuery().split("&")) {
            String[] parts = pair.split("=", 2);
            if (parts.length != 2) {
                continue;
            }
            if (key.equals(parts[0])) {
                return URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
