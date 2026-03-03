package com.example.post.adapters.in.grpc;

import com.example.post.application.service.FeedService;
import com.example.post.application.service.PostService;
import com.example.post.domain.Comment;
import com.example.post.domain.FeedView;
import com.example.post.domain.PostDetailView;
import com.example.post.domain.PostLikeStatus;
import com.example.post.domain.PostNotFoundException;
import com.example.post.domain.PostView;
import com.example.post.v1.AuthorPostsRequest;
import com.example.post.v1.CreateCommentRequest;
import com.example.post.v1.CreateCommentResponse;
import com.example.post.v1.CreatePostRequest;
import com.example.post.v1.CreatePostResponse;
import com.example.post.v1.FeedRequest;
import com.example.post.v1.FeedResponse;
import com.example.post.v1.GetPostRequest;
import com.example.post.v1.GetPostResponse;
import com.example.post.v1.LikePostRequest;
import com.example.post.v1.LikePostResponse;
import com.example.post.v1.PostServiceGrpc;
import com.example.post.v1.SearchPostsRequest;
import com.example.post.v1.TrendingRequest;
import com.example.post.v1.UnlikePostRequest;
import com.example.post.v1.UnlikePostResponse;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.util.UUID;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class PostGrpcService extends PostServiceGrpc.PostServiceImplBase {
    private final PostService postService;
    private final FeedService feedService;

    public PostGrpcService(PostService postService, FeedService feedService) {
        this.postService = postService;
        this.feedService = feedService;
    }

    @Override
    public void createPost(CreatePostRequest request, StreamObserver<CreatePostResponse> responseObserver) {
        try {
            UUID authorId = parseUuid(request.getAuthorId(), "Author ID");
            PostView post = postService.createPost(authorId, request.getContent(), request.getVisibility());
            responseObserver.onNext(CreatePostResponse.newBuilder().setPost(toProto(post)).build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void createComment(CreateCommentRequest request, StreamObserver<CreateCommentResponse> responseObserver) {
        try {
            UUID authorId = parseUuid(request.getAuthorId(), "Author ID");
            UUID postId = parseUuid(request.getPostId(), "Post ID");
            Comment comment = postService.createComment(authorId, postId, request.getContent());
            responseObserver.onNext(CreateCommentResponse.newBuilder().setComment(toProto(comment)).build());
            responseObserver.onCompleted();
        } catch (PostNotFoundException ex) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(ex.getMessage()).asRuntimeException());
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void getFeed(FeedRequest request, StreamObserver<FeedResponse> responseObserver) {
        try {
            UUID userId = parseUuid(request.getUserId(), "User ID");
            FeedView page = feedService.loadFeed(userId, request.getCursor(), request.getLimit());
            responseObserver.onNext(toFeedResponse(page));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void getAuthorPosts(AuthorPostsRequest request, StreamObserver<FeedResponse> responseObserver) {
        try {
            UUID authorId = parseUuid(request.getAuthorId(), "Author ID");
            UUID viewerId = parseUuid(request.getViewerId(), "Viewer ID");
            FeedView page = feedService.loadByAuthor(authorId, viewerId, request.getCursor(), request.getLimit());
            responseObserver.onNext(toFeedResponse(page));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void searchPosts(SearchPostsRequest request, StreamObserver<FeedResponse> responseObserver) {
        try {
            UUID viewerId = parseUuid(request.getViewerId(), "Viewer ID");
            FeedView page = feedService.search(viewerId, request.getQuery(), request.getCursor(), request.getLimit());
            responseObserver.onNext(toFeedResponse(page));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void getPost(GetPostRequest request, StreamObserver<GetPostResponse> responseObserver) {
        try {
            UUID postId = parseUuid(request.getPostId(), "Post ID");
            UUID viewerId = parseUuid(request.getViewerId(), "Viewer ID");
            PostDetailView detail = postService.getPostDetail(postId, viewerId)
                    .orElseThrow(() -> new PostNotFoundException(postId));
            GetPostResponse.Builder builder = GetPostResponse.newBuilder()
                    .setPost(toProto(detail.post()));
            detail.comments().forEach(comment -> builder.addComments(toProto(comment)));
            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (PostNotFoundException ex) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(ex.getMessage()).asRuntimeException());
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void likePost(LikePostRequest request, StreamObserver<LikePostResponse> responseObserver) {
        try {
            UUID postId = parseUuid(request.getPostId(), "Post ID");
            UUID userId = parseUuid(request.getUserId(), "User ID");
            PostLikeStatus status = postService.likePost(postId, userId);
            responseObserver.onNext(LikePostResponse.newBuilder()
                    .setPostId(status.postId().toString())
                    .setLikeCount(status.likeCount())
                    .setLiked(status.liked())
                    .build());
            responseObserver.onCompleted();
        } catch (PostNotFoundException ex) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(ex.getMessage()).asRuntimeException());
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void unlikePost(UnlikePostRequest request, StreamObserver<UnlikePostResponse> responseObserver) {
        try {
            UUID postId = parseUuid(request.getPostId(), "Post ID");
            UUID userId = parseUuid(request.getUserId(), "User ID");
            PostLikeStatus status = postService.unlikePost(postId, userId);
            responseObserver.onNext(UnlikePostResponse.newBuilder()
                    .setPostId(status.postId().toString())
                    .setLikeCount(status.likeCount())
                    .setLiked(status.liked())
                    .build());
            responseObserver.onCompleted();
        } catch (PostNotFoundException ex) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(ex.getMessage()).asRuntimeException());
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void getTrending(TrendingRequest request, StreamObserver<FeedResponse> responseObserver) {
        try {
            UUID viewerId = parseUuid(request.getViewerId(), "Viewer ID");
            FeedView page = feedService.loadTrending(viewerId, request.getCursor(), request.getLimit());
            responseObserver.onNext(toFeedResponse(page));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    private UUID parseUuid(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " is required");
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(label + " must be a UUID");
        }
    }

    private FeedResponse toFeedResponse(FeedView page) {
        FeedResponse.Builder builder = FeedResponse.newBuilder();
        page.posts().forEach(post -> builder.addPosts(toProto(post)));
        if (page.nextCursor() != null) {
            builder.setNextCursor(page.nextCursor());
        }
        return builder.build();
    }

    private com.example.post.v1.Post toProto(PostView post) {
        return com.example.post.v1.Post.newBuilder()
                .setId(post.id().toString())
                .setAuthorId(post.authorId().toString())
                .setContent(post.content())
                .setVisibility(post.visibility())
                .setCreatedAt(post.createdAt().toString())
                .setCommentCount(post.commentCount())
                .setLikeCount(post.likeCount())
                .setLikedByMe(post.likedByViewer())
                .build();
    }

    private com.example.post.v1.Comment toProto(Comment comment) {
        return com.example.post.v1.Comment.newBuilder()
                .setId(comment.id().toString())
                .setPostId(comment.postId().toString())
                .setAuthorId(comment.authorId().toString())
                .setContent(comment.content())
                .setCreatedAt(comment.createdAt().toString())
                .build();
    }
}
