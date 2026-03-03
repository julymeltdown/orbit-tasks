package com.example.gateway.adapters.out.grpc;

import com.example.gateway.application.dto.post.CommentCreateRequest;
import com.example.gateway.application.dto.post.CommentResponse;
import com.example.gateway.application.dto.post.FeedResponse;
import com.example.gateway.application.dto.post.PostCreateRequest;
import com.example.gateway.application.dto.post.PostDetailResponse;
import com.example.gateway.application.dto.post.PostLikeResponse;
import com.example.gateway.application.dto.post.PostResponse;
import com.example.gateway.application.port.out.PostClientPort;
import com.example.post.v1.AuthorPostsRequest;
import com.example.post.v1.CreateCommentRequest;
import com.example.post.v1.CreatePostRequest;
import com.example.post.v1.FeedRequest;
import com.example.post.v1.GetPostRequest;
import com.example.post.v1.LikePostRequest;
import com.example.post.v1.PostServiceGrpc;
import com.example.post.v1.SearchPostsRequest;
import com.example.post.v1.TrendingRequest;
import com.example.post.v1.UnlikePostRequest;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PostClient implements PostClientPort {
    private final PostServiceGrpc.PostServiceBlockingStub stub;

    public PostClient(PostServiceGrpc.PostServiceBlockingStub stub) {
        this.stub = stub;
    }

    @Override
    public FeedResponse getFeed(String userId, String cursor, int limit) {
        FeedRequest.Builder builder = FeedRequest.newBuilder()
                .setUserId(userId)
                .setLimit(limit);
        if (cursor != null && !cursor.isBlank()) {
            builder.setCursor(cursor);
        }
        var response = stub.getFeed(builder.build());
        return new FeedResponse(
                response.getPostsList().stream().map(this::toResponse).toList(),
                response.getNextCursor().isBlank() ? null : response.getNextCursor());
    }

    @Override
    public FeedResponse getAuthorPosts(String authorId, String viewerId, String cursor, int limit) {
        AuthorPostsRequest.Builder builder = AuthorPostsRequest.newBuilder()
                .setAuthorId(authorId)
                .setLimit(limit)
                .setViewerId(viewerId);
        if (cursor != null && !cursor.isBlank()) {
            builder.setCursor(cursor);
        }
        var response = stub.getAuthorPosts(builder.build());
        return new FeedResponse(
                response.getPostsList().stream().map(this::toResponse).toList(),
                response.getNextCursor().isBlank() ? null : response.getNextCursor());
    }

    @Override
    public FeedResponse searchPosts(String viewerId, String query, String cursor, int limit) {
        SearchPostsRequest.Builder builder = SearchPostsRequest.newBuilder()
                .setQuery(query == null ? "" : query)
                .setLimit(limit)
                .setViewerId(viewerId);
        if (cursor != null && !cursor.isBlank()) {
            builder.setCursor(cursor);
        }
        var response = stub.searchPosts(builder.build());
        return new FeedResponse(
                response.getPostsList().stream().map(this::toResponse).toList(),
                response.getNextCursor().isBlank() ? null : response.getNextCursor());
    }

    @Override
    public FeedResponse getTrending(String viewerId, String cursor, int limit) {
        TrendingRequest.Builder builder = TrendingRequest.newBuilder()
                .setViewerId(viewerId)
                .setLimit(limit);
        if (cursor != null && !cursor.isBlank()) {
            builder.setCursor(cursor);
        }
        var response = stub.getTrending(builder.build());
        return new FeedResponse(
                response.getPostsList().stream().map(this::toResponse).toList(),
                response.getNextCursor().isBlank() ? null : response.getNextCursor());
    }

    @Override
    public PostDetailResponse getPost(String viewerId, String postId) {
        var response = stub.getPost(GetPostRequest.newBuilder()
                .setPostId(postId)
                .setViewerId(viewerId)
                .build());
        List<CommentResponse> comments = response.getCommentsList().stream()
                .map(comment -> new CommentResponse(
                        comment.getId(),
                        comment.getPostId(),
                        comment.getAuthorId(),
                        comment.getContent(),
                        comment.getCreatedAt()))
                .toList();
        return new PostDetailResponse(toResponse(response.getPost()), comments);
    }

    @Override
    public PostResponse createPost(String userId, PostCreateRequest request) {
        CreatePostRequest grpcRequest = CreatePostRequest.newBuilder()
                .setAuthorId(userId)
                .setContent(request.content())
                .setVisibility(request.visibility())
                .build();
        var response = stub.createPost(grpcRequest);
        return toResponse(response.getPost());
    }

    @Override
    public CommentResponse createComment(String userId, String postId, CommentCreateRequest request) {
        CreateCommentRequest grpcRequest = CreateCommentRequest.newBuilder()
                .setPostId(postId)
                .setAuthorId(userId)
                .setContent(request.content())
                .build();
        var response = stub.createComment(grpcRequest);
        var comment = response.getComment();
        return new CommentResponse(
                comment.getId(),
                comment.getPostId(),
                comment.getAuthorId(),
                comment.getContent(),
                comment.getCreatedAt());
    }

    @Override
    public PostLikeResponse likePost(String userId, String postId) {
        var response = stub.likePost(LikePostRequest.newBuilder()
                .setPostId(postId)
                .setUserId(userId)
                .build());
        return new PostLikeResponse(response.getPostId(), response.getLikeCount(), response.getLiked());
    }

    @Override
    public PostLikeResponse unlikePost(String userId, String postId) {
        var response = stub.unlikePost(UnlikePostRequest.newBuilder()
                .setPostId(postId)
                .setUserId(userId)
                .build());
        return new PostLikeResponse(response.getPostId(), response.getLikeCount(), response.getLiked());
    }

    private PostResponse toResponse(com.example.post.v1.Post post) {
        return new PostResponse(
                post.getId(),
                post.getAuthorId(),
                post.getContent(),
                post.getVisibility(),
                post.getCreatedAt(),
                post.getCommentCount(),
                post.getLikeCount(),
                post.getLikedByMe());
    }
}
