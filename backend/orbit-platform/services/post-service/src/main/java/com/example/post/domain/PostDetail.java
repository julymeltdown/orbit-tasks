package com.example.post.domain;

import java.util.List;

public record PostDetail(
        Post post,
        List<Comment> comments
) {
}
