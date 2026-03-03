package com.example.gateway.application.dto;

public record EmailAvailabilityResponse(
        String email,
        boolean available,
        String status
) {
}
