package com.example.post.domain;

import java.util.UUID;

public class PostNotFoundException extends RuntimeException {
    public PostNotFoundException(UUID postId) {
        super("Post not found: " + postId);
    }

    public PostNotFoundException(String message) {
        super(message);
    }
}

