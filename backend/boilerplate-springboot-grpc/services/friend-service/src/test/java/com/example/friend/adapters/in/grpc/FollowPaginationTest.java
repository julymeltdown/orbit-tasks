package com.example.friend.adapters.in.grpc;

import com.example.friend.adapters.out.memory.InMemoryFollowRepository;
import com.example.friend.application.service.FollowService;
import com.example.friend.v1.FollowUserRequest;
import com.example.friend.v1.ListFollowingRequest;
import com.example.friend.v1.ListFollowingResponse;
import io.grpc.stub.StreamObserver;
import java.time.Clock;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class FollowPaginationTest {
    private static final String FOLLOWER_ID = "77777777-7777-7777-7777-777777777777";

    @Test
    void paginatesFollowingList() {
        FriendGrpcService service = new FriendGrpcService(new FollowService(new InMemoryFollowRepository(), Clock.systemUTC()));
        service.followUser(FollowUserRequest.newBuilder()
                .setFollowerId(FOLLOWER_ID)
                .setFolloweeId("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
                .build(), new RecordingObserver<>());
        service.followUser(FollowUserRequest.newBuilder()
                .setFollowerId(FOLLOWER_ID)
                .setFolloweeId("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
                .build(), new RecordingObserver<>());
        service.followUser(FollowUserRequest.newBuilder()
                .setFollowerId(FOLLOWER_ID)
                .setFolloweeId("cccccccc-cccc-cccc-cccc-cccccccccccc")
                .build(), new RecordingObserver<>());

        RecordingObserver<ListFollowingResponse> page1 = new RecordingObserver<>();
        service.listFollowing(ListFollowingRequest.newBuilder()
                .setUserId(FOLLOWER_ID)
                .setLimit(2)
                .build(), page1);

        assertNotNull(page1.value);
        assertEquals(2, page1.value.getEdgesCount());
        String cursor = page1.value.getNextCursor();
        assertFalse(cursor.isBlank());

        RecordingObserver<ListFollowingResponse> page2 = new RecordingObserver<>();
        service.listFollowing(ListFollowingRequest.newBuilder()
                .setUserId(FOLLOWER_ID)
                .setCursor(cursor)
                .setLimit(2)
                .build(), page2);

        assertNotNull(page2.value);
        assertEquals(1, page2.value.getEdgesCount());
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
