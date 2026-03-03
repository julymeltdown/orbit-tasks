package com.example.gateway.application.service;

import com.example.gateway.application.dto.friend.FollowActionResponse;
import com.example.gateway.application.dto.friend.FollowCountsResponse;
import com.example.gateway.application.dto.friend.FollowListResponse;
import com.example.gateway.application.dto.friend.FollowStatusResponse;
import com.example.gateway.application.port.out.FriendClientPort;
import org.springframework.stereotype.Service;

@Service
public class FriendGatewayService {
    private final FriendClientPort friendClient;

    public FriendGatewayService(FriendClientPort friendClient) {
        this.friendClient = friendClient;
    }

    public FollowActionResponse follow(String followerId, String followeeId) {
        return friendClient.follow(followerId, followeeId);
    }

    public FollowActionResponse unfollow(String followerId, String followeeId) {
        return friendClient.unfollow(followerId, followeeId);
    }

    public FollowListResponse listFollowers(String userId, String cursor, Integer limit) {
        return friendClient.listFollowers(userId, cursor, limit);
    }

    public FollowListResponse listFollowing(String userId, String cursor, Integer limit) {
        return friendClient.listFollowing(userId, cursor, limit);
    }

    public FollowCountsResponse counts(String userId) {
        return friendClient.getCounts(userId);
    }

    public FollowStatusResponse status(String followerId, String followeeId) {
        return friendClient.checkFollowing(followerId, followeeId);
    }
}
