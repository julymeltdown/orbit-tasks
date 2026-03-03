package com.example.post.domain;

import java.util.List;

public record FeedPage(
        List<Post> posts,
        String nextCursor
) {
}
