package com.example.auth.application.service;

public record EmailAvailability(String email, EmailAvailabilityStatus status) {
    public boolean available() {
        return status == EmailAvailabilityStatus.AVAILABLE;
    }

    public static EmailAvailability available(String email) {
        return new EmailAvailability(email, EmailAvailabilityStatus.AVAILABLE);
    }

    public static EmailAvailability taken(String email) {
        return new EmailAvailability(email, EmailAvailabilityStatus.TAKEN);
    }

    public static EmailAvailability invalid(String email) {
        return new EmailAvailability(email, EmailAvailabilityStatus.INVALID);
    }
}
