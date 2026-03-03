package com.example.post.adapters.out.grpc;

import com.example.friend.v1.FriendServiceGrpc;
import com.example.friend.v1.ListFollowersRequest;
import com.example.friend.v1.ListFollowersResponse;
import com.example.friend.v1.ListFollowingRequest;
import com.example.friend.v1.ListFollowingResponse;
import com.example.post.application.port.out.FriendClientPort;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class FriendGrpcClientAdapter implements FriendClientPort {
    private static final int DEFAULT_PAGE_SIZE = 200;

    private final FriendServiceGrpc.FriendServiceBlockingStub stub;

    public FriendGrpcClientAdapter(FriendServiceGrpc.FriendServiceBlockingStub stub) {
        this.stub = stub;
    }

    @Override
    public List<UUID> fetchFollowingIds(UUID userId) {
        return fetchIds(userId, true);
    }

    @Override
    public List<UUID> fetchFollowerIds(UUID userId) {
        return fetchIds(userId, false);
    }

    private List<UUID> fetchIds(UUID userId, boolean following) {
        List<UUID> ids = new ArrayList<>();
        String cursor = "";
        while (true) {
            String nextCursor;
            if (following) {
                ListFollowingResponse response = stub.listFollowing(ListFollowingRequest.newBuilder()
                        .setUserId(userId.toString())
                        .setCursor(cursor)
                        .setLimit(DEFAULT_PAGE_SIZE)
                        .build());
                response.getEdgesList().forEach(edge -> ids.add(UUID.fromString(edge.getFolloweeId())));
                nextCursor = response.getNextCursor();
            } else {
                ListFollowersResponse response = stub.listFollowers(ListFollowersRequest.newBuilder()
                        .setUserId(userId.toString())
                        .setCursor(cursor)
                        .setLimit(DEFAULT_PAGE_SIZE)
                        .build());
                response.getEdgesList().forEach(edge -> ids.add(UUID.fromString(edge.getFollowerId())));
                nextCursor = response.getNextCursor();
            }
            if (nextCursor == null || nextCursor.isBlank() || nextCursor.equals(cursor)) {
                break;
            }
            cursor = nextCursor;
        }
        return ids;
    }
}
