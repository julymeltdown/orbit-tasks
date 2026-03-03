package com.orbit.profile.application.service;

import com.orbit.profile.domain.NotificationPreference;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class ProfileSettingsService {
    private final Clock clock = Clock.systemUTC();
    private final Map<String, ProfileSettings> settingsByUserId = new ConcurrentHashMap<>();

    public ProfileSettings get(String userId) {
        requireUserId(userId);
        return settingsByUserId.computeIfAbsent(userId, this::defaultSettings);
    }

    public ProfileSettings update(String userId,
                                  String timezone,
                                  String locale,
                                  String presence,
                                  String notificationPreference,
                                  boolean mentionPush,
                                  boolean threadPush,
                                  boolean digestEnabled) {
        requireUserId(userId);
        ProfileSettings updated = new ProfileSettings(
                userId,
                normalize(timezone, "UTC"),
                normalize(locale, "en-US"),
                normalize(presence, "online"),
                NotificationPreference.fromValue(notificationPreference),
                mentionPush,
                threadPush,
                digestEnabled,
                Instant.now(clock));

        settingsByUserId.put(userId, updated);
        return updated;
    }

    private ProfileSettings defaultSettings(String userId) {
        return new ProfileSettings(
                userId,
                "UTC",
                "en-US",
                "online",
                NotificationPreference.MENTIONS_ONLY,
                true,
                true,
                false,
                Instant.now(clock));
    }

    private static String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private static void requireUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID is required");
        }
    }

    public record ProfileSettings(
            String userId,
            String timezone,
            String locale,
            String presence,
            NotificationPreference notificationPreference,
            boolean mentionPush,
            boolean threadPush,
            boolean digestEnabled,
            Instant updatedAt
    ) {
    }
}
