package com.example.gateway.application.dto;

import java.time.Instant;

public record ErrorResponse(String code, String message, String traceId, Instant timestamp, Object details) {
}
