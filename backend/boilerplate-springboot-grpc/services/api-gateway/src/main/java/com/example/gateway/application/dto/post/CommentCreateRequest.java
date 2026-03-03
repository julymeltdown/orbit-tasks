package com.example.gateway.application.dto.post;

import jakarta.validation.constraints.NotBlank;

public record CommentCreateRequest(@NotBlank String content) {
}
