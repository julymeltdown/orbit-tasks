package com.example.gateway.application.dto.profile;

import jakarta.validation.constraints.NotBlank;

public record ProfileUpdateRequest(
        @NotBlank String username,
        @NotBlank String nickname,
        String avatarUrl,
        String bio) {
}
