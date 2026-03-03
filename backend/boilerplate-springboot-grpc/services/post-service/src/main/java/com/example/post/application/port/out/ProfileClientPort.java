package com.example.post.application.port.out;

import com.example.post.domain.ProfileSnapshot;
import java.util.UUID;

public interface ProfileClientPort {
    ProfileSnapshot fetchProfile(UUID userId);
}
