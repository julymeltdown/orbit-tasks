package com.example.auth.adapters.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record OAuthLinkRequest(
        @NotBlank String code,
        @NotBlank String state) {
}
