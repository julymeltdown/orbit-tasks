package com.example.gateway.application.dto.friend;

import jakarta.validation.constraints.NotBlank;

public record FollowRequest(@NotBlank String targetUserId) {
}
