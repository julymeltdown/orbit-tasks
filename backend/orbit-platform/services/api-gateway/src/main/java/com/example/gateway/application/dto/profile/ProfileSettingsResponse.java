package com.example.gateway.application.dto.profile;

public record ProfileSettingsResponse(
        String userId,
        String timezone,
        String locale,
        String presence,
        String notificationPreference,
        boolean mentionPush,
        boolean threadPush,
        boolean digestEnabled,
        String updatedAt
) {
}
