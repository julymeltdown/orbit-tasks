package com.example.gateway.application.dto.post;

import jakarta.validation.constraints.NotBlank;

public record PostCreateRequest(
        @NotBlank String content,
        @NotBlank String visibility) {
}
