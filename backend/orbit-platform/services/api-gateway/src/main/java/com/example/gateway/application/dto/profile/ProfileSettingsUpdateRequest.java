package com.example.gateway.application.dto.profile;

import jakarta.validation.constraints.NotBlank;

public record ProfileSettingsUpdateRequest(
        @NotBlank String timezone,
        @NotBlank String locale,
        @NotBlank String presence,
        @NotBlank String notificationPreference,
        boolean mentionPush,
        boolean threadPush,
        boolean digestEnabled
) {
}
