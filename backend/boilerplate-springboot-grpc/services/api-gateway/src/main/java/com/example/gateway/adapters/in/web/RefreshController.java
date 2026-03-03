package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.AuthResponse;
import com.example.gateway.application.service.AuthGatewayService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/auth")
public class RefreshController {
    private final AuthGatewayService authService;
    private final String refreshCookieName;
    private final String refreshCookieDomain;
    private final boolean refreshCookieSecure;
    private final Duration refreshCookieMaxAge;

    public RefreshController(AuthGatewayService authService,
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

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        String refreshToken = resolveCookie(request, refreshCookieName);
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Missing refresh token");
        }
        AuthResponse response = authService.refresh(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(response.refreshToken()).toString())
                .body(stripRefreshToken(response));
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
}
