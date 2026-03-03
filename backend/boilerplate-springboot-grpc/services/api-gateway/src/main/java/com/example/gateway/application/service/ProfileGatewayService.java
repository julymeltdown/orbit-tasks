package com.example.gateway.application.service;

import com.example.gateway.application.dto.profile.AvatarContent;
import com.example.gateway.application.dto.profile.ProfileBatchResponse;
import com.example.gateway.application.dto.profile.ProfileResponse;
import com.example.gateway.application.dto.profile.ProfileSearchResponse;
import com.example.gateway.application.dto.profile.ProfileUpdateRequest;
import com.example.gateway.application.dto.friend.FollowCountsResponse;
import com.example.gateway.application.port.out.FriendClientPort;
import com.example.gateway.application.port.out.ProfileClientPort;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
public class ProfileGatewayService {
    private final ProfileClientPort profileClient;
    private final FriendClientPort friendClient;

    public ProfileGatewayService(ProfileClientPort profileClient, FriendClientPort friendClient) {
        this.profileClient = profileClient;
        this.friendClient = friendClient;
    }

    public ProfileResponse getProfile(String userId) {
        ProfileResponse profile = profileClient.getProfile(userId);
        FollowCountsResponse counts = friendClient.getCounts(profile.userId());
        return mergeCounts(profile, counts);
    }

    public ProfileResponse getProfileByUsername(String username) {
        ProfileResponse profile = profileClient.getProfileByUsername(username);
        FollowCountsResponse counts = friendClient.getCounts(profile.userId());
        return mergeCounts(profile, counts);
    }

    public ProfileBatchResponse getProfiles(List<String> userIds) {
        ProfileBatchResponse response = profileClient.getProfiles(userIds);
        return new ProfileBatchResponse(mergeCounts(response.profiles()));
    }

    public ProfileSearchResponse searchProfiles(String query, String cursor, int limit) {
        ProfileSearchResponse response = profileClient.searchProfiles(query, cursor, limit);
        return new ProfileSearchResponse(mergeCounts(response.profiles()), response.nextCursor());
    }

    public AvatarContent getAvatar(String userId) {
        return profileClient.getAvatar(userId);
    }

    public String uploadAvatar(String userId, byte[] content, String contentType, String filename) {
        return profileClient.uploadAvatar(userId, content, contentType, filename);
    }

    public ProfileResponse updateProfile(String userId, ProfileUpdateRequest request) {
        ProfileResponse profile = profileClient.updateProfile(userId, request);
        FollowCountsResponse counts = friendClient.getCounts(profile.userId());
        return mergeCounts(profile, counts);
    }

    private List<ProfileResponse> mergeCounts(List<ProfileResponse> profiles) {
        if (profiles == null || profiles.isEmpty()) {
            return List.of();
        }
        Map<String, FollowCountsResponse> countsByUser = friendClient.getCountsBatch(
                profiles.stream()
                        .map(ProfileResponse::userId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList());
        return profiles.stream()
                .map(profile -> mergeCounts(profile, countsByUser.get(profile.userId())))
                .toList();
    }

    private ProfileResponse mergeCounts(ProfileResponse profile, FollowCountsResponse counts) {
        if (profile == null) {
            return null;
        }
        long followerCount = counts != null ? counts.followerCount() : profile.followerCount();
        long followingCount = counts != null ? counts.followingCount() : profile.followingCount();
        return new ProfileResponse(
                profile.userId(),
                profile.username(),
                profile.nickname(),
                profile.avatarUrl(),
                profile.bio(),
                followerCount,
                followingCount,
                profile.postCount());
    }
}
