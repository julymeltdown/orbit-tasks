package com.example.gateway.application.service;

import com.example.gateway.application.dto.post.CommentCreateRequest;
import com.example.gateway.application.dto.post.CommentResponse;
import com.example.gateway.application.dto.post.FeedResponse;
import com.example.gateway.application.dto.post.PostCreateRequest;
import com.example.gateway.application.dto.post.PostDetailResponse;
import com.example.gateway.application.dto.post.PostLikeResponse;
import com.example.gateway.application.dto.post.PostResponse;
import com.example.gateway.application.port.out.PostClientPort;
import org.springframework.stereotype.Service;

@Service
public class PostGatewayService {
    private final PostClientPort postClient;

    public PostGatewayService(PostClientPort postClient) {
        this.postClient = postClient;
    }

    public FeedResponse getFeed(String userId, String cursor, int limit) {
        return postClient.getFeed(userId, cursor, limit);
    }

    public FeedResponse getAuthorPosts(String authorId, String viewerId, String cursor, int limit) {
        return postClient.getAuthorPosts(authorId, viewerId, cursor, limit);
    }

    public FeedResponse searchPosts(String viewerId, String query, String cursor, int limit) {
        return postClient.searchPosts(viewerId, query, cursor, limit);
    }

    public FeedResponse getTrending(String viewerId, String cursor, int limit) {
        return postClient.getTrending(viewerId, cursor, limit);
    }

    public PostDetailResponse getPost(String viewerId, String postId) {
        return postClient.getPost(viewerId, postId);
    }

    public PostResponse createPost(String userId, PostCreateRequest request) {
        return postClient.createPost(userId, request);
    }

    public CommentResponse createComment(String userId, String postId, CommentCreateRequest request) {
        return postClient.createComment(userId, postId, request);
    }

    public PostLikeResponse likePost(String userId, String postId) {
        return postClient.likePost(userId, postId);
    }

    public PostLikeResponse unlikePost(String userId, String postId) {
        return postClient.unlikePost(userId, postId);
    }
}
