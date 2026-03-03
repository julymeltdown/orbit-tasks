package com.example.friend.adapters.in.grpc;

import com.example.friend.application.service.FollowService;
import com.example.friend.adapters.out.memory.InMemoryFollowRepository;
import com.example.friend.v1.CheckFollowRequest;
import com.example.friend.v1.CheckFollowResponse;
import com.example.friend.v1.FollowUserRequest;
import com.example.friend.v1.FollowUserResponse;
import com.example.friend.v1.ListFollowersRequest;
import com.example.friend.v1.ListFollowersResponse;
import com.example.friend.v1.ListFollowingRequest;
import com.example.friend.v1.ListFollowingResponse;
import com.example.friend.v1.UnfollowUserRequest;
import com.example.friend.v1.UnfollowUserResponse;
import io.grpc.stub.StreamObserver;
import java.time.Clock;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FriendGrpcServiceRequestListTest {
    private static final String FOLLOWER_ID = "11111111-1111-1111-1111-111111111111";
    private static final String FOLLOWEE_ID = "22222222-2222-2222-2222-222222222222";
    private static final String FOLLOWER_ID_TWO = "33333333-3333-3333-3333-333333333333";
    private static final String FOLLOWEE_ID_TWO = "44444444-4444-4444-4444-444444444444";

    @Test
    void followsAndListsFollowersAndFollowing() {
        FriendGrpcService service = newService();
        RecordingObserver<FollowUserResponse> followObserver = new RecordingObserver<>();
        service.followUser(FollowUserRequest.newBuilder()
                .setFollowerId(FOLLOWER_ID)
                .setFolloweeId(FOLLOWEE_ID)
                .build(), followObserver);

        RecordingObserver<ListFollowersResponse> followersObserver = new RecordingObserver<>();
        service.listFollowers(ListFollowersRequest.newBuilder()
                .setUserId(FOLLOWEE_ID)
                .setLimit(10)
                .build(), followersObserver);

        RecordingObserver<ListFollowingResponse> followingObserver = new RecordingObserver<>();
        service.listFollowing(ListFollowingRequest.newBuilder()
                .setUserId(FOLLOWER_ID)
                .setLimit(10)
                .build(), followingObserver);

        assertNotNull(followObserver.value);
        assertTrue(followObserver.value.getFollowing());
        assertNotNull(followersObserver.value);
        assertEquals(1, followersObserver.value.getEdgesCount());
        assertNotNull(followingObserver.value);
        assertEquals(1, followingObserver.value.getEdgesCount());
        assertEquals(FOLLOWER_ID, followersObserver.value.getEdges(0).getFollowerId());
        assertEquals(FOLLOWEE_ID, followingObserver.value.getEdges(0).getFolloweeId());
    }

    @Test
    void unfollowRemovesRelationship() {
        FriendGrpcService service = newService();
        service.followUser(FollowUserRequest.newBuilder()
                .setFollowerId(FOLLOWER_ID_TWO)
                .setFolloweeId(FOLLOWEE_ID_TWO)
                .build(), new RecordingObserver<>());

        RecordingObserver<UnfollowUserResponse> unfollowObserver = new RecordingObserver<>();
        service.unfollowUser(UnfollowUserRequest.newBuilder()
                .setFollowerId(FOLLOWER_ID_TWO)
                .setFolloweeId(FOLLOWEE_ID_TWO)
                .build(), unfollowObserver);

        assertNotNull(unfollowObserver.value);
        assertFalse(unfollowObserver.value.getFollowing());
    }

    @Test
    void reportsFollowStatus() {
        FriendGrpcService service = newService();
        service.followUser(FollowUserRequest.newBuilder()
                .setFollowerId("55555555-5555-5555-5555-555555555555")
                .setFolloweeId("66666666-6666-6666-6666-666666666666")
                .build(), new RecordingObserver<>());

        RecordingObserver<CheckFollowResponse> statusObserver = new RecordingObserver<>();
        service.checkFollow(CheckFollowRequest.newBuilder()
                .setFollowerId("55555555-5555-5555-5555-555555555555")
                .setFolloweeId("66666666-6666-6666-6666-666666666666")
                .build(), statusObserver);

        assertNotNull(statusObserver.value);
        assertTrue(statusObserver.value.getFollowing());
    }

    private static class RecordingObserver<T> implements StreamObserver<T> {
        private T value;

        @Override
        public void onNext(T value) {
            this.value = value;
        }

        @Override
        public void onError(Throwable t) {
            throw new AssertionError("Unexpected error", t);
        }

        @Override
        public void onCompleted() {
            // no-op
        }
    }

    private FriendGrpcService newService() {
        return new FriendGrpcService(new FollowService(new InMemoryFollowRepository(), Clock.systemUTC()));
    }
}
