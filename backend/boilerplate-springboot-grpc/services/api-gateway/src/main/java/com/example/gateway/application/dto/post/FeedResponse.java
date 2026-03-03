package com.example.gateway.application.dto.post;

import java.util.List;

public record FeedResponse(
        List<PostResponse> posts,
        String nextCursor) {
}
