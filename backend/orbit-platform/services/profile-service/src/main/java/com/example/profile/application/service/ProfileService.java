package com.example.profile.application.service;

import com.example.profile.application.port.out.AvatarRepositoryPort;
import com.example.profile.application.port.out.ProfileRepositoryPort;
import com.example.profile.domain.Avatar;
import com.example.profile.domain.Profile;
import com.example.profile.domain.ProfileSearchPage;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{3,20}$");
    private static final int DEFAULT_MAX_AVATAR_BYTES = 5 * 1024 * 1024;

    private final ProfileRepositoryPort profileRepository;
    private final AvatarRepositoryPort avatarRepository;
    @Value("${profile.avatar.max-bytes:" + DEFAULT_MAX_AVATAR_BYTES + "}")
    private int maxAvatarBytes = DEFAULT_MAX_AVATAR_BYTES;

    public ProfileService(ProfileRepositoryPort profileRepository, AvatarRepositoryPort avatarRepository) {
        this.profileRepository = profileRepository;
        this.avatarRepository = avatarRepository;
    }

    public Profile getProfile(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID is required");
        }
        return profileRepository.findByUserId(userId).orElseGet(() -> defaultProfile(userId));
    }

    public Optional<Profile> getProfileByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        return profileRepository.findByUsername(normalizeUsername(username));
    }

    public List<Profile> getProfiles(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }

        List<String> normalized = userIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(id -> !id.isBlank())
                .toList();

        if (normalized.isEmpty()) {
            return List.of();
        }

        Map<String, Profile> existing = new HashMap<>();
        for (Profile profile : profileRepository.findByUserIds(normalized)) {
            if (profile != null && profile.userId() != null && !profile.userId().isBlank()) {
                existing.put(profile.userId(), profile);
            }
        }

        List<Profile> result = new ArrayList<>(normalized.size());
        for (String userId : normalized) {
            result.add(existing.getOrDefault(userId, defaultProfile(userId)));
        }
        return result;
    }

    public Profile updateProfile(String userId, String username, String nickname, String avatarUrl, String bio) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID is required");
        }

        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new IllegalArgumentException("Username must be 3-20 characters (letters, numbers, underscore)");
        }

        if (nickname == null || nickname.isBlank()) {
            throw new IllegalArgumentException("Display name is required");
        }

        String normalizedUsername = normalizeUsername(username);

        Optional<Profile> usernameOwner = profileRepository.findByUsername(normalizedUsername);
        if (usernameOwner.isPresent() && !userId.equals(usernameOwner.get().userId())) {
            throw new IllegalArgumentException("Username already taken");
        }

        Profile existing = profileRepository.findByUserId(userId).orElse(null);
        long followerCount = existing != null ? existing.followerCount() : 0L;
        long followingCount = existing != null ? existing.followingCount() : 0L;
        long postCount = existing != null ? existing.postCount() : 0L;

        Profile toSave = new Profile(
                userId,
                normalizedUsername,
                nickname.trim(),
                normalizeOptional(avatarUrl),
                normalizeOptional(bio),
                followerCount,
                followingCount,
                postCount);

        return profileRepository.save(toSave);
    }

    public ProfileSearchPage searchProfiles(String query, String cursor, int limit) {
        if (query == null || query.isBlank()) {
            return new ProfileSearchPage(List.of(), null);
        }
        String needle = query.trim().toLowerCase();
        String normalizedCursor = cursor == null ? "" : cursor.trim().toLowerCase();
        int resolvedLimit = limit > 0 ? limit : 10;

        return profileRepository.search(needle, normalizedCursor, resolvedLimit);
    }

    public String uploadAvatar(String userId, byte[] content, String contentType) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID is required");
        }
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Avatar image is required");
        }
        if (content.length > maxAvatarBytes) {
            throw new IllegalArgumentException("Avatar image must be <= " + humanReadableSize(maxAvatarBytes));
        }

        String resolvedContentType = (contentType == null || contentType.isBlank())
                ? "application/octet-stream"
                : contentType;

        avatarRepository.save(userId, new Avatar(content, resolvedContentType));
        return "/api/profile/avatar/" + userId;
    }

    public Optional<Avatar> getAvatar(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID is required");
        }
        return avatarRepository.find(userId);
    }

    public void clearAll() {
        profileRepository.clear();
        avatarRepository.clear();
    }

    private static String normalizeUsername(String username) {
        return username.trim().toLowerCase();
    }

    private static String normalizeOptional(String value) {
        return value == null ? "" : value.trim();
    }

    private static Profile defaultProfile(String userId) {
        return new Profile(userId, "", "", "", "", 0L, 0L, 0L);
    }

    private static String humanReadableSize(int bytes) {
        if (bytes % (1024 * 1024) == 0) {
            return (bytes / (1024 * 1024)) + "MB";
        }
        if (bytes % 1024 == 0) {
            return (bytes / 1024) + "KB";
        }
        return bytes + "B";
    }
}
