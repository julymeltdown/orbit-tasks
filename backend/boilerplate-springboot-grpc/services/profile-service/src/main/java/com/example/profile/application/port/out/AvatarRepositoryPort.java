package com.example.profile.application.port.out;

import com.example.profile.domain.Avatar;
import java.util.Optional;

public interface AvatarRepositoryPort {
    void save(String userId, Avatar avatar);

    Optional<Avatar> find(String userId);

    void clear();
}
