package com.example.profile.adapters.out.memory;

import com.example.profile.application.port.out.ProfileRepositoryPort;
import com.example.profile.domain.Profile;
import com.example.profile.domain.ProfileSearchPage;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class InMemoryProfileRepository implements ProfileRepositoryPort {
    private final Map<String, Profile> profilesByUserId = new ConcurrentHashMap<>();
    private final Map<String, String> usernameIndex = new ConcurrentHashMap<>();

    @Override
    public Optional<Profile> findByUserId(String userId) {
        return Optional.ofNullable(profilesByUserId.get(userId));
    }

    @Override
    public Optional<Profile> findByUsername(String normalizedUsername) {
        String ownerId = usernameIndex.get(normalizedUsername);
        if (ownerId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(profilesByUserId.get(ownerId));
    }

    @Override
    public List<Profile> findByUserIds(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        Set<String> unique = Set.copyOf(userIds);
        List<Profile> found = new ArrayList<>();
        for (String userId : unique) {
            Profile profile = profilesByUserId.get(userId);
            if (profile != null) {
                found.add(profile);
            }
        }
        return found;
    }

    @Override
    public Profile save(Profile profile) {
        if (profile == null || profile.userId() == null || profile.userId().isBlank()) {
            throw new IllegalArgumentException("User ID is required");
        }

        Profile existing = profilesByUserId.get(profile.userId());
        if (existing != null && existing.username() != null && !existing.username().isBlank()) {
            // Remove old username mapping if we're changing it.
            String oldUsername = existing.username().trim().toLowerCase();
            if (!oldUsername.equals(profile.username())) {
                usernameIndex.remove(oldUsername, profile.userId());
            }
        }

        if (profile.username() != null && !profile.username().isBlank()) {
            usernameIndex.put(profile.username(), profile.userId());
        }

        profilesByUserId.put(profile.userId(), profile);
        return profile;
    }

    @Override
    public ProfileSearchPage search(String needle, String normalizedCursor, int limit) {
        if (needle == null || needle.isBlank()) {
            return new ProfileSearchPage(List.of(), null);
        }

        List<Map.Entry<String, Profile>> matches = profilesByUserId.entrySet().stream()
                .filter(entry -> entry.getValue() != null)
                .filter(entry -> entry.getValue().username() != null && !entry.getValue().username().isBlank())
                .filter(entry -> {
                    Profile stored = entry.getValue();
                    String username = stored.username().toLowerCase();
                    String nickname = stored.nickname() == null ? "" : stored.nickname().toLowerCase();
                    return username.contains(needle) || nickname.contains(needle);
                })
                .sorted(Comparator.comparing(entry -> entry.getValue().username()))
                .toList();

        List<Profile> page = new ArrayList<>();
        boolean hasMore = false;
        boolean pastCursor = normalizedCursor == null || normalizedCursor.isBlank();
        for (Map.Entry<String, Profile> entry : matches) {
            if (!pastCursor) {
                if (entry.getValue().username().compareToIgnoreCase(normalizedCursor) > 0) {
                    pastCursor = true;
                } else {
                    continue;
                }
            }

            if (page.size() < limit) {
                page.add(entry.getValue());
            } else {
                hasMore = true;
                break;
            }
        }

        String nextCursor = null;
        if (hasMore && !page.isEmpty()) {
            nextCursor = page.get(page.size() - 1).username();
        }

        return new ProfileSearchPage(page, nextCursor);
    }

    @Override
    public void clear() {
        profilesByUserId.clear();
        usernameIndex.clear();
    }
}
