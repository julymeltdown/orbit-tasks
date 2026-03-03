package com.example.friend.domain;

import java.util.List;

public record FollowPage(List<FollowEdge> edges, String nextCursor, long totalCount) {
}
