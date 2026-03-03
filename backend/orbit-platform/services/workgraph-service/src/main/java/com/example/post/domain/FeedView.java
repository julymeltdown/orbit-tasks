package com.example.post.domain;

import java.util.List;

public record FeedView(
        List<PostView> posts,
        String nextCursor
) {
}
