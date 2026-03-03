package com.example.friend.adapters.in.grpc;

import com.example.friend.adapters.out.memory.InMemoryFollowRepository;
import com.example.friend.application.service.FollowService;
import com.example.friend.v1.FollowUserRequest;
import com.example.friend.v1.FollowStats;
import com.example.friend.v1.GetFollowStatsRequest;
import com.example.friend.v1.GetFollowStatsResponse;
import io.grpc.stub.StreamObserver;
import java.time.Clock;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class FollowStatsBatchTest {
    @Test
    void returnsCountsForMultipleUsers() {
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

        RecordingObserver<GetFollowStatsResponse> observer = new RecordingObserver<>();
        service.getFollowStats(GetFollowStatsRequest.newBuilder()
                .addUserIds(followee)
                .addUserIds(followerA)
                .build(), observer);

        assertNotNull(observer.value);
        Map<String, FollowStats> statsByUser = observer.value.getStatsList().stream()
                .collect(Collectors.toMap(FollowStats::getUserId, Function.identity()));

        assertEquals(2, statsByUser.get(followee).getFollowerCount());
        assertEquals(0, statsByUser.get(followee).getFollowingCount());
        assertEquals(1, statsByUser.get(followerA).getFollowingCount());
        assertEquals(0, statsByUser.get(followerA).getFollowerCount());
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
