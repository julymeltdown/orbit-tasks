package com.example.profile.adapters.out.memory;

import com.example.profile.application.port.out.AvatarRepositoryPort;
import com.example.profile.domain.Avatar;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class InMemoryAvatarRepository implements AvatarRepositoryPort {
    private final Map<String, Avatar> avatarsByUserId = new ConcurrentHashMap<>();

    @Override
    public void save(String userId, Avatar avatar) {
        avatarsByUserId.put(userId, avatar);
    }

    @Override
    public Optional<Avatar> find(String userId) {
        return Optional.ofNullable(avatarsByUserId.get(userId));
    }

    @Override
    public void clear() {
        avatarsByUserId.clear();
    }
}
