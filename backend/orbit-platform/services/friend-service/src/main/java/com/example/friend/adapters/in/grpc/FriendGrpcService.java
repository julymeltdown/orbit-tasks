package com.example.friend.adapters.in.grpc;

import com.example.friend.application.service.FollowService;
import com.example.friend.domain.FollowEdge;
import com.example.friend.domain.FollowPage;
import com.example.friend.v1.CheckFollowRequest;
import com.example.friend.v1.CheckFollowResponse;
import com.example.friend.v1.FollowUserRequest;
import com.example.friend.v1.FollowUserResponse;
import com.example.friend.v1.FriendServiceGrpc;
import com.example.friend.v1.GetFollowCountsRequest;
import com.example.friend.v1.GetFollowCountsResponse;
import com.example.friend.v1.GetFollowStatsRequest;
import com.example.friend.v1.GetFollowStatsResponse;
import com.example.friend.v1.ListFollowersRequest;
import com.example.friend.v1.ListFollowersResponse;
import com.example.friend.v1.ListFollowingRequest;
import com.example.friend.v1.ListFollowingResponse;
import com.example.friend.v1.UnfollowUserRequest;
import com.example.friend.v1.UnfollowUserResponse;
import com.example.friend.v1.FollowStats;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class FriendGrpcService extends FriendServiceGrpc.FriendServiceImplBase {
    private final FollowService followService;

    public FriendGrpcService(FollowService followService) {
        this.followService = followService;
    }

    @Override
    public void followUser(FollowUserRequest request, StreamObserver<FollowUserResponse> responseObserver) {
        try {
            UUID followerId = parseId(request.getFollowerId(), "Follower ID");
            UUID followeeId = parseId(request.getFolloweeId(), "Followee ID");
            FollowEdge edge = followService.follow(followerId, followeeId);
            responseObserver.onNext(FollowUserResponse.newBuilder()
                    .setEdge(toGrpc(edge))
                    .setFollowing(true)
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void unfollowUser(UnfollowUserRequest request, StreamObserver<UnfollowUserResponse> responseObserver) {
        try {
            UUID followerId = parseId(request.getFollowerId(), "Follower ID");
            UUID followeeId = parseId(request.getFolloweeId(), "Followee ID");
            followService.unfollow(followerId, followeeId);
            responseObserver.onNext(UnfollowUserResponse.newBuilder()
                    .setFollowing(false)
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void listFollowers(ListFollowersRequest request, StreamObserver<ListFollowersResponse> responseObserver) {
        try {
            UUID userId = parseId(request.getUserId(), "User ID");
            FollowPage page = followService.listFollowers(userId, request.getCursor(), request.getLimit());
            responseObserver.onNext(ListFollowersResponse.newBuilder()
                    .addAllEdges(page.edges().stream().map(this::toGrpc).toList())
                    .setNextCursor(page.nextCursor() == null ? "" : page.nextCursor())
                    .setTotalCount(page.totalCount())
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void listFollowing(ListFollowingRequest request, StreamObserver<ListFollowingResponse> responseObserver) {
        try {
            UUID userId = parseId(request.getUserId(), "User ID");
            FollowPage page = followService.listFollowing(userId, request.getCursor(), request.getLimit());
            responseObserver.onNext(ListFollowingResponse.newBuilder()
                    .addAllEdges(page.edges().stream().map(this::toGrpc).toList())
                    .setNextCursor(page.nextCursor() == null ? "" : page.nextCursor())
                    .setTotalCount(page.totalCount())
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void getFollowCounts(GetFollowCountsRequest request,
                                StreamObserver<GetFollowCountsResponse> responseObserver) {
        try {
            UUID userId = parseId(request.getUserId(), "User ID");
            var counts = followService.counts(userId);
            responseObserver.onNext(GetFollowCountsResponse.newBuilder()
                    .setFollowerCount(counts.followerCount())
                    .setFollowingCount(counts.followingCount())
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void getFollowStats(GetFollowStatsRequest request,
                               StreamObserver<GetFollowStatsResponse> responseObserver) {
        try {
            List<UUID> userIds = request.getUserIdsList().stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(value -> parseId(value, "User ID"))
                    .distinct()
                    .toList();
            Map<UUID, com.example.friend.domain.FollowCounts> countsByUser = followService.batchCounts(userIds);
            GetFollowStatsResponse.Builder builder = GetFollowStatsResponse.newBuilder();
            for (UUID userId : userIds) {
                com.example.friend.domain.FollowCounts counts = countsByUser.get(userId);
                if (counts == null) {
                    continue;
                }
                builder.addStats(FollowStats.newBuilder()
                        .setUserId(userId.toString())
                        .setFollowerCount(counts.followerCount())
                        .setFollowingCount(counts.followingCount())
                        .build());
            }
            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void checkFollow(CheckFollowRequest request, StreamObserver<CheckFollowResponse> responseObserver) {
        try {
            UUID followerId = parseId(request.getFollowerId(), "Follower ID");
            UUID followeeId = parseId(request.getFolloweeId(), "Followee ID");
            boolean following = followService.isFollowing(followerId, followeeId);
            responseObserver.onNext(CheckFollowResponse.newBuilder().setFollowing(following).build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    public void seedFollow(String followerId, String followeeId) {
        followService.follow(UUID.fromString(followerId), UUID.fromString(followeeId));
    }

    public void clear() {
        followService.clearAll();
    }

    private UUID parseId(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " is required");
        }
        return UUID.fromString(value);
    }

    private com.example.friend.v1.FollowEdge toGrpc(FollowEdge edge) {
        return com.example.friend.v1.FollowEdge.newBuilder()
                .setFollowerId(edge.followerId().toString())
                .setFolloweeId(edge.followeeId().toString())
                .setCreatedAt(edge.createdAt().toString())
                .build();
    }
}
