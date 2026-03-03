package com.example.gateway.adapters.out.grpc;

import com.example.friend.v1.CheckFollowRequest;
import com.example.friend.v1.FollowUserRequest;
import com.example.friend.v1.FriendServiceGrpc;
import com.example.friend.v1.GetFollowCountsRequest;
import com.example.friend.v1.GetFollowStatsRequest;
import com.example.friend.v1.ListFollowersRequest;
import com.example.friend.v1.ListFollowingRequest;
import com.example.friend.v1.UnfollowUserRequest;
import com.example.friend.v1.FollowStats;
import com.example.gateway.application.dto.friend.FollowActionResponse;
import com.example.gateway.application.dto.friend.FollowCountsResponse;
import com.example.gateway.application.dto.friend.FollowEdgeResponse;
import com.example.gateway.application.dto.friend.FollowListResponse;
import com.example.gateway.application.dto.friend.FollowStatusResponse;
import com.example.gateway.application.port.out.FriendClientPort;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class FriendClient implements FriendClientPort {
    private final FriendServiceGrpc.FriendServiceBlockingStub stub;

    public FriendClient(FriendServiceGrpc.FriendServiceBlockingStub stub) {
        this.stub = stub;
    }

    @Override
    public FollowActionResponse follow(String followerId, String followeeId) {
        var response = stub.followUser(FollowUserRequest.newBuilder()
                .setFollowerId(followerId)
                .setFolloweeId(followeeId)
                .build());
        String followedAt = response.hasEdge() ? response.getEdge().getCreatedAt() : null;
        return new FollowActionResponse(response.getFollowing(), followedAt);
    }

    @Override
    public FollowActionResponse unfollow(String followerId, String followeeId) {
        var response = stub.unfollowUser(UnfollowUserRequest.newBuilder()
                .setFollowerId(followerId)
                .setFolloweeId(followeeId)
                .build());
        return new FollowActionResponse(response.getFollowing(), null);
    }

    @Override
    public FollowListResponse listFollowers(String userId, String cursor, Integer limit) {
        var response = stub.listFollowers(ListFollowersRequest.newBuilder()
                .setUserId(userId)
                .setCursor(cursor == null ? "" : cursor)
                .setLimit(limit == null ? 0 : limit)
                .build());
        return new FollowListResponse(mapEdges(response.getEdgesList(), true),
                response.getNextCursor().isBlank() ? null : response.getNextCursor(),
                response.getTotalCount());
    }

    @Override
    public FollowListResponse listFollowing(String userId, String cursor, Integer limit) {
        var response = stub.listFollowing(ListFollowingRequest.newBuilder()
                .setUserId(userId)
                .setCursor(cursor == null ? "" : cursor)
                .setLimit(limit == null ? 0 : limit)
                .build());
        return new FollowListResponse(mapEdges(response.getEdgesList(), false),
                response.getNextCursor().isBlank() ? null : response.getNextCursor(),
                response.getTotalCount());
    }

    @Override
    public FollowCountsResponse getCounts(String userId) {
        var response = stub.getFollowCounts(GetFollowCountsRequest.newBuilder()
                .setUserId(userId)
                .build());
        return new FollowCountsResponse(response.getFollowerCount(), response.getFollowingCount());
    }

    @Override
    public Map<String, FollowCountsResponse> getCountsBatch(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        var response = stub.getFollowStats(GetFollowStatsRequest.newBuilder()
                .addAllUserIds(userIds)
                .build());
        Map<String, FollowCountsResponse> result = new LinkedHashMap<>();
        for (FollowStats stat : response.getStatsList()) {
            result.put(stat.getUserId(), new FollowCountsResponse(stat.getFollowerCount(), stat.getFollowingCount()));
        }
        return result;
    }

    @Override
    public FollowStatusResponse checkFollowing(String followerId, String followeeId) {
        var response = stub.checkFollow(CheckFollowRequest.newBuilder()
                .setFollowerId(followerId)
                .setFolloweeId(followeeId)
                .build());
        return new FollowStatusResponse(response.getFollowing());
    }

    private List<FollowEdgeResponse> mapEdges(List<com.example.friend.v1.FollowEdge> edges,
                                              boolean followers) {
        return edges.stream()
                .map(edge -> new FollowEdgeResponse(
                        followers ? edge.getFollowerId() : edge.getFolloweeId(),
                        edge.getCreatedAt()))
                .toList();
    }
}
