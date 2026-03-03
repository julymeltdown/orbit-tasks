package com.orbit.profile.adapters.out.persistence;

import com.example.profile.application.port.out.ProfileRepositoryPort;
import com.example.profile.domain.Profile;
import com.example.profile.domain.ProfileSearchPage;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class ProfileJpaRepositoryAdapter implements ProfileRepositoryPort {
    private final ConcurrentMap<String, Profile> cacheByUserId = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, String> usernameIndex = new ConcurrentHashMap<>();

    @Override
    public Optional<Profile> findByUserId(String userId) {
        return Optional.ofNullable(cacheByUserId.get(userId));
    }

    @Override
    public Optional<Profile> findByUsername(String normalizedUsername) {
        String ownerId = usernameIndex.get(normalizedUsername);
        if (ownerId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(cacheByUserId.get(ownerId));
    }

    @Override
    public List<Profile> findByUserIds(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return Set.copyOf(userIds).stream()
                .map(cacheByUserId::get)
                .filter(value -> value != null)
                .toList();
    }

    @Override
    public Profile save(Profile profile) {
        if (profile.username() != null && !profile.username().isBlank()) {
            usernameIndex.put(profile.username(), profile.userId());
        }
        cacheByUserId.put(profile.userId(), profile);
        return profile;
    }

    @Override
    public ProfileSearchPage search(String needle, String normalizedCursor, int limit) {
        if (needle == null || needle.isBlank()) {
            return new ProfileSearchPage(List.of(), null);
        }

        List<Profile> sorted = cacheByUserId.values().stream()
                .filter(profile -> profile.username() != null && !profile.username().isBlank())
                .filter(profile -> profile.username().contains(needle)
                        || (profile.nickname() != null && profile.nickname().toLowerCase().contains(needle)))
                .sorted((a, b) -> a.username().compareToIgnoreCase(b.username()))
                .toList();

        int resolvedLimit = limit <= 0 ? 10 : limit;
        List<Profile> page = sorted.stream().limit(resolvedLimit).toList();
        String nextCursor = sorted.size() > resolvedLimit ? page.get(page.size() - 1).username() : null;
        return new ProfileSearchPage(page, nextCursor);
    }

    @Override
    public void clear() {
        cacheByUserId.clear();
        usernameIndex.clear();
    }
}
