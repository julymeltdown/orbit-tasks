package com.example.profile.domain;

public record Avatar(
        byte[] content,
        String contentType
) {
}
