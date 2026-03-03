package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.AuthResponse;
import com.example.gateway.application.dto.EmailAvailabilityResponse;
import com.example.gateway.application.dto.EmailCheckRequest;
import com.example.gateway.application.dto.EmailSignupRequest;
import com.example.gateway.application.dto.EmailVerifyRequest;
import com.example.gateway.application.dto.LoginRequest;
import com.example.gateway.application.dto.PasswordResetConfirmRequest;
import com.example.gateway.application.dto.PasswordResetRequest;
import com.example.gateway.application.dto.PasswordResetResponse;
import com.example.gateway.application.dto.SignupResponse;
import com.example.gateway.application.dto.WorkspaceClaimResponse;
import com.example.gateway.application.service.AuthGatewayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthGatewayService authService;
    private final String refreshCookieName;
    private final String refreshCookieDomain;
    private final boolean refreshCookieSecure;
    private final Duration refreshCookieMaxAge;

    public AuthController(AuthGatewayService authService,
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

    @PostMapping("/email/signup")
    public SignupResponse signup(@Valid @RequestBody EmailSignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/email/verify")
    public SignupResponse verify(@Valid @RequestBody EmailVerifyRequest request) {
        return authService.verify(request);
    }

    @PostMapping("/email/check")
    public EmailAvailabilityResponse checkEmail(@Valid @RequestBody EmailCheckRequest request) {
        return authService.checkEmail(request);
    }

    @PostMapping("/password/reset/request")
    public PasswordResetResponse requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        return authService.requestPasswordReset(request);
    }

    @PostMapping("/password/reset/confirm")
    public PasswordResetResponse confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        return authService.confirmPasswordReset(request);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(
                request,
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent"));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(response.refreshToken()).toString())
                .body(stripRefreshToken(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String refreshToken = resolveCookie(request, refreshCookieName);
        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.logout(refreshToken);
        }
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    @GetMapping("/workspace-claims")
    public List<WorkspaceClaimResponse> workspaceClaims(@RequestParam UUID userId) {
        return authService.listWorkspaceClaims(userId);
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

    private ResponseCookie clearRefreshCookie() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(refreshCookieName, "")
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
