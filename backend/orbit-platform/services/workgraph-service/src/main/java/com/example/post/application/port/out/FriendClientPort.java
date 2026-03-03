package com.example.post.application.port.out;

import java.util.List;
import java.util.UUID;

public interface FriendClientPort {
    List<UUID> fetchFollowingIds(UUID userId);

    List<UUID> fetchFollowerIds(UUID userId);
}
