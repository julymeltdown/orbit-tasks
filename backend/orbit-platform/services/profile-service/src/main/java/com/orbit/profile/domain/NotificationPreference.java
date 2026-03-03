package com.orbit.profile.domain;

public enum NotificationPreference {
    MENTIONS_ONLY,
    MENTIONS_AND_THREADS,
    ALL_ACTIVITY,
    DIGEST_ONLY;

    public static NotificationPreference fromValue(String raw) {
        if (raw == null || raw.isBlank()) {
            return MENTIONS_ONLY;
        }
        String normalized = raw.trim().toUpperCase().replace('-', '_');
        for (NotificationPreference value : values()) {
            if (value.name().equals(normalized)) {
                return value;
            }
        }
        return MENTIONS_ONLY;
    }
}
