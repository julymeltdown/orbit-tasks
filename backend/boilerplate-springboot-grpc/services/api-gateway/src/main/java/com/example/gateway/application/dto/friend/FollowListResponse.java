package com.example.gateway.application.dto.friend;

import java.util.List;

public record FollowListResponse(List<FollowEdgeResponse> edges, String nextCursor, long totalCount) {
}
