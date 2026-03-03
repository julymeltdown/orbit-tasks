package com.example.gateway.application.dto;

import java.util.UUID;

public record SignupResponse(UUID userId, String status) {
}
