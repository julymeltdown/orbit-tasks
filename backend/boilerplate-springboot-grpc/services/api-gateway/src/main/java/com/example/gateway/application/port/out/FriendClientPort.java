package com.example.gateway.application.port.out;

import com.example.gateway.application.dto.friend.FollowActionResponse;
import com.example.gateway.application.dto.friend.FollowCountsResponse;
import com.example.gateway.application.dto.friend.FollowListResponse;
import com.example.gateway.application.dto.friend.FollowStatusResponse;
import java.util.List;
import java.util.Map;

public interface FriendClientPort {
    FollowActionResponse follow(String followerId, String followeeId);

    FollowActionResponse unfollow(String followerId, String followeeId);

    FollowListResponse listFollowers(String userId, String cursor, Integer limit);

    FollowListResponse listFollowing(String userId, String cursor, Integer limit);

    FollowCountsResponse getCounts(String userId);

    Map<String, FollowCountsResponse> getCountsBatch(List<String> userIds);

    FollowStatusResponse checkFollowing(String followerId, String followeeId);
}
