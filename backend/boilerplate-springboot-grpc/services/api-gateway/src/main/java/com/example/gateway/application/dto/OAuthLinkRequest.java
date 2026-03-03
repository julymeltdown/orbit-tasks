package com.example.gateway.application.dto;

import jakarta.validation.constraints.NotBlank;

public record OAuthLinkRequest(
        @NotBlank String code,
        @NotBlank String state) {
}
