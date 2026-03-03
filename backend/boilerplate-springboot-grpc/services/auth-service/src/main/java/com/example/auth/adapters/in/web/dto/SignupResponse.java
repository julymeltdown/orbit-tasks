package com.example.auth.adapters.in.web.dto;

import java.util.UUID;

public record SignupResponse(UUID userId, String status) {
}
