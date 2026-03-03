package com.example.gateway.application.port.out;

import com.example.gateway.application.dto.profile.AvatarContent;
import com.example.gateway.application.dto.profile.ProfileBatchResponse;
import com.example.gateway.application.dto.profile.ProfileResponse;
import com.example.gateway.application.dto.profile.ProfileSearchResponse;
import com.example.gateway.application.dto.profile.ProfileUpdateRequest;

public interface ProfileClientPort {
    ProfileResponse getProfile(String userId);

    ProfileResponse getProfileByUsername(String username);

    ProfileBatchResponse getProfiles(Iterable<String> userIds);

    ProfileSearchResponse searchProfiles(String query, String cursor, int limit);

    AvatarContent getAvatar(String userId);

    String uploadAvatar(String userId, byte[] content, String contentType, String filename);

    ProfileResponse updateProfile(String userId, ProfileUpdateRequest request);
}
