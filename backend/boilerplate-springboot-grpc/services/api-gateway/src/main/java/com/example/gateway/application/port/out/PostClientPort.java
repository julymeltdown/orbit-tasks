package com.example.gateway.application.port.out;

import com.example.gateway.application.dto.post.CommentCreateRequest;
import com.example.gateway.application.dto.post.CommentResponse;
import com.example.gateway.application.dto.post.FeedResponse;
import com.example.gateway.application.dto.post.PostCreateRequest;
import com.example.gateway.application.dto.post.PostDetailResponse;
import com.example.gateway.application.dto.post.PostLikeResponse;
import com.example.gateway.application.dto.post.PostResponse;

public interface PostClientPort {
    FeedResponse getFeed(String userId, String cursor, int limit);

    FeedResponse getAuthorPosts(String authorId, String viewerId, String cursor, int limit);

    FeedResponse searchPosts(String viewerId, String query, String cursor, int limit);

    FeedResponse getTrending(String viewerId, String cursor, int limit);

    PostDetailResponse getPost(String viewerId, String postId);

    PostResponse createPost(String userId, PostCreateRequest request);

    CommentResponse createComment(String userId, String postId, CommentCreateRequest request);

    PostLikeResponse likePost(String userId, String postId);

    PostLikeResponse unlikePost(String userId, String postId);
}
