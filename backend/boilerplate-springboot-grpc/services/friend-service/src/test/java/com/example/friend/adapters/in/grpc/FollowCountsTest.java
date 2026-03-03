package com.example.friend.adapters.in.grpc;

import com.example.friend.adapters.out.memory.InMemoryFollowRepository;
import com.example.friend.application.service.FollowService;
import com.example.friend.v1.FollowUserRequest;
import com.example.friend.v1.GetFollowCountsRequest;
import com.example.friend.v1.GetFollowCountsResponse;
import com.example.friend.v1.ListFollowersRequest;
import com.example.friend.v1.ListFollowersResponse;
import io.grpc.stub.StreamObserver;
import java.time.Clock;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class FollowCountsTest {
    @Test
    void returnsCountsAndTotals() {
        FriendGrpcService service = new FriendGrpcService(new FollowService(new InMemoryFollowRepository(), Clock.systemUTC()));
        String followerA = "11111111-1111-1111-1111-111111111111";
        String followerB = "22222222-2222-2222-2222-222222222222";
        String followee = "33333333-3333-3333-3333-333333333333";

        service.followUser(FollowUserRequest.newBuilder()
                .setFollowerId(followerA)
                .setFolloweeId(followee)
                .build(), new RecordingObserver<>());
        service.followUser(FollowUserRequest.newBuilder()
                .setFollowerId(followerB)
                .setFolloweeId(followee)
                .build(), new RecordingObserver<>());

        RecordingObserver<GetFollowCountsResponse> countsObserver = new RecordingObserver<>();
        service.getFollowCounts(GetFollowCountsRequest.newBuilder()
                .setUserId(followee)
                .build(), countsObserver);

        assertNotNull(countsObserver.value);
        assertEquals(2, countsObserver.value.getFollowerCount());
        assertEquals(0, countsObserver.value.getFollowingCount());

        RecordingObserver<ListFollowersResponse> listObserver = new RecordingObserver<>();
        service.listFollowers(ListFollowersRequest.newBuilder()
                .setUserId(followee)
                .setLimit(10)
                .build(), listObserver);

        assertNotNull(listObserver.value);
        assertEquals(2, listObserver.value.getTotalCount());
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
}
