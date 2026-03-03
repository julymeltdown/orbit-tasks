package com.example.gateway.adapters.in.web;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping
public class DeepLinkController {
    private final Map<String, DeepLinkView> tokens = new ConcurrentHashMap<>();

    @PostMapping("/api/deeplinks")
    public DeepLinkView issue(@RequestBody IssueDeepLinkRequest request) {
        String token = UUID.randomUUID().toString().replace("-", "");
        DeepLinkView view = new DeepLinkView(
                token,
                request.workspaceId(),
                request.targetPath(),
                false,
                System.currentTimeMillis() + 1000L * 60L * 60L * 6L);
        tokens.put(token, view);
        return view;
    }

    @GetMapping("/api/deeplinks/{token}/resolve")
    public DeepLinkResolveResponse resolve(@PathVariable String token, JwtAuthenticationToken auth) {
        DeepLinkView view = tokens.get(token);
        if (view == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Deep link token not found");
        }
        if (System.currentTimeMillis() > view.expiresAtEpochMs()) {
            return new DeepLinkResolveResponse("EXPIRED", "/inbox", "expired");
        }
        if (auth == null || auth.getToken() == null) {
            return new DeepLinkResolveResponse("AUTH_REQUIRED", "/login?returnTo=/dl/" + token, "login_required");
        }
        return new DeepLinkResolveResponse("OK", view.targetPath(), "resolved");
    }

    @GetMapping("/dl/{token}")
    public DeepLinkResolveResponse bounce(@PathVariable String token, JwtAuthenticationToken auth) {
        return resolve(token, auth);
    }

    public record IssueDeepLinkRequest(String workspaceId, String targetPath) {
    }

    public record DeepLinkView(String token, String workspaceId, String targetPath, boolean consumed, long expiresAtEpochMs) {
    }

    public record DeepLinkResolveResponse(String status, String targetPath, String reason) {
    }
}
