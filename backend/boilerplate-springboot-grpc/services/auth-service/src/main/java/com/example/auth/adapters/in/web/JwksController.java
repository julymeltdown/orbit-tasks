package com.example.auth.adapters.in.web;

import com.example.auth.application.security.JwtTokenService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/.well-known")
public class JwksController {
    private final JwtTokenService jwtTokenService;

    public JwksController(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    @GetMapping("/jwks.json")
    public Map<String, Object> jwks() {
        return jwtTokenService.jwkSet();
    }
}
