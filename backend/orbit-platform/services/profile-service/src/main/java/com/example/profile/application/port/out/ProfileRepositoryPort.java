package com.example.profile.application.port.out;

import com.example.profile.domain.Profile;
import com.example.profile.domain.ProfileSearchPage;
import java.util.List;
import java.util.Optional;

public interface ProfileRepositoryPort {
    Optional<Profile> findByUserId(String userId);

    Optional<Profile> findByUsername(String normalizedUsername);

    List<Profile> findByUserIds(List<String> userIds);

    Profile save(Profile profile);

    ProfileSearchPage search(String needle, String normalizedCursor, int limit);

    void clear();
}
