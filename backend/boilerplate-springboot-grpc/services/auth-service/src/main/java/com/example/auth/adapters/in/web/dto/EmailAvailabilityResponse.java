package com.example.auth.adapters.in.web.dto;

public record EmailAvailabilityResponse(
        String email,
        boolean available,
        String status
) {
}
