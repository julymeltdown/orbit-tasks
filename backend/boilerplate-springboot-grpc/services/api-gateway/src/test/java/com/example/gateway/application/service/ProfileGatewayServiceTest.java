package com.example.gateway.application.service;

import com.example.gateway.application.dto.friend.FollowActionResponse;
import com.example.gateway.application.dto.friend.FollowCountsResponse;
import com.example.gateway.application.dto.friend.FollowListResponse;
import com.example.gateway.application.dto.friend.FollowStatusResponse;
import com.example.gateway.application.dto.profile.AvatarContent;
import com.example.gateway.application.dto.profile.ProfileBatchResponse;
import com.example.gateway.application.dto.profile.ProfileResponse;
import com.example.gateway.application.dto.profile.ProfileSearchResponse;
import com.example.gateway.application.dto.profile.ProfileUpdateRequest;
import com.example.gateway.application.port.out.FriendClientPort;
import com.example.gateway.application.port.out.ProfileClientPort;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProfileGatewayServiceTest {
    @Test
    void mergesFollowCountsForBatchProfiles() {
        ProfileClientPort profileClient = new ProfileClientPort() {
            @Override
            public ProfileResponse getProfile(String userId) {
                throw new UnsupportedOperationException();
            }

            @Override
            public ProfileResponse getProfileByUsername(String username) {
                throw new UnsupportedOperationException();
            }

            @Override
            public ProfileBatchResponse getProfiles(Iterable<String> userIds) {
                return new ProfileBatchResponse(List.of(
                        new ProfileResponse("user-a", "alpha", "Alpha", "/a.png", "bio-a", 0, 0, 3),
                        new ProfileResponse("user-b", "beta", "Beta", "/b.png", "bio-b", 0, 0, 7)
                ));
            }

            @Override
            public ProfileSearchResponse searchProfiles(String query, String cursor, int limit) {
                throw new UnsupportedOperationException();
            }

            @Override
            public AvatarContent getAvatar(String userId) {
                throw new UnsupportedOperationException();
            }

            @Override
            public String uploadAvatar(String userId, byte[] content, String contentType, String filename) {
                throw new UnsupportedOperationException();
            }

            @Override
            public ProfileResponse updateProfile(String userId, ProfileUpdateRequest request) {
                throw new UnsupportedOperationException();
            }
        };

        FriendClientPort friendClient = new FriendClientPort() {
            @Override
            public FollowActionResponse follow(String followerId, String followeeId) {
                throw new UnsupportedOperationException();
            }

            @Override
            public FollowActionResponse unfollow(String followerId, String followeeId) {
                throw new UnsupportedOperationException();
            }

            @Override
            public FollowListResponse listFollowers(String userId, String cursor, Integer limit) {
                throw new UnsupportedOperationException();
            }

            @Override
            public FollowListResponse listFollowing(String userId, String cursor, Integer limit) {
                throw new UnsupportedOperationException();
            }

            @Override
            public FollowCountsResponse getCounts(String userId) {
                throw new UnsupportedOperationException();
            }

            @Override
            public Map<String, FollowCountsResponse> getCountsBatch(List<String> userIds) {
                return Map.of(
                        "user-a", new FollowCountsResponse(5, 2),
                        "user-b", new FollowCountsResponse(1, 4)
                );
            }

            @Override
            public FollowStatusResponse checkFollowing(String followerId, String followeeId) {
                throw new UnsupportedOperationException();
            }
        };

        ProfileGatewayService service = new ProfileGatewayService(profileClient, friendClient);

        ProfileBatchResponse response = service.getProfiles(List.of("user-a", "user-b"));

        ProfileResponse first = response.profiles().get(0);
        ProfileResponse second = response.profiles().get(1);

        assertEquals(5, first.followerCount());
        assertEquals(2, first.followingCount());
        assertEquals(1, second.followerCount());
        assertEquals(4, second.followingCount());
    }
}
