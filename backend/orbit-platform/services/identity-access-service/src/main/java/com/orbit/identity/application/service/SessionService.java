package com.orbit.identity.application.service;

import com.example.auth.application.security.JwtTokenService;
import com.example.auth.application.service.AuthSession;
import com.example.auth.application.service.LoginService;
import com.orbit.identity.adapters.out.persistence.SessionPolicyRepository;
import com.orbit.identity.domain.WorkspaceClaim;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SessionService {
    private final LoginService loginService;
    private final SessionPolicyRepository sessionPolicyRepository;

    public SessionService(LoginService loginService,
                          SessionPolicyRepository sessionPolicyRepository) {
        this.loginService = loginService;
        this.sessionPolicyRepository = sessionPolicyRepository;
    }

    public SessionSnapshot login(String email, String password, String ipAddress, String userAgent) {
        AuthSession authSession = loginService.loginWithEmail(email, password, ipAddress, userAgent);
        return toSnapshot(authSession.userId(), authSession.tokens());
    }

    public SessionSnapshot refresh(String refreshToken) {
        AuthSession authSession = loginService.refreshTokens(refreshToken);
        return toSnapshot(authSession.userId(), authSession.tokens());
    }

    public void logout(String refreshToken) {
        loginService.logout(refreshToken);
    }

    public List<WorkspaceClaim> workspaceClaims(UUID userId) {
        List<WorkspaceClaim> claims = sessionPolicyRepository
                .findAllByUserIdAndEnabledTrueOrderByDefaultWorkspaceDescUpdatedAtDesc(userId)
                .stream()
                .map(entity -> new WorkspaceClaim(
                        entity.getWorkspaceId(),
                        entity.getWorkspaceName(),
                        entity.getRole(),
                        entity.isDefaultWorkspace()))
                .toList();

        if (!claims.isEmpty()) {
            return claims;
        }

        // Safe default for local bootstrap environments.
        UUID fallbackWorkspace = UUID.nameUUIDFromBytes(("workspace:" + userId).getBytes());
        return List.of(new WorkspaceClaim(fallbackWorkspace, "Default Workspace", "WORKSPACE_MEMBER", true));
    }

    private SessionSnapshot toSnapshot(UUID userId, JwtTokenService.TokenPair tokens) {
        return new SessionSnapshot(userId, tokens.accessToken(), tokens.refreshToken(), workspaceClaims(userId));
    }

    public record SessionSnapshot(
            UUID userId,
            String accessToken,
            String refreshToken,
            List<WorkspaceClaim> workspaceClaims
    ) {
    }
}
