package com.example.post.domain;

import java.util.List;

public record PostDetailView(
        PostView post,
        List<Comment> comments
) {
}
