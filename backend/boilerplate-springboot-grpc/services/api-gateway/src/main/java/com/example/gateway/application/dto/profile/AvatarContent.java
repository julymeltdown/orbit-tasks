package com.example.gateway.application.dto.profile;

public record AvatarContent(
        byte[] content,
        String contentType
) {
}
