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
import com.example.post.v1.SearchPostsRequest;
import com.example.post.v1.TrendingRequest;
import com.example.post.v1.UnlikePostRequest;
import com.example.post.v1.UnlikePostResponse;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PostGrpcServiceTest {

    @Test
    void createPostReturnsProtoPostOnSuccess() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        UUID authorId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        PostView view = new PostView(
                postId,
                authorId,
                "hello",
                "PUBLIC",
                Instant.parse("2026-01-20T00:00:00Z"),
                2,
                7,
                true);
        when(postService.createPost(authorId, "hello", "PUBLIC")).thenReturn(view);

        CapturingObserver<CreatePostResponse> observer = new CapturingObserver<>();
        grpc.createPost(CreatePostRequest.newBuilder()
                .setAuthorId(authorId.toString())
                .setContent("hello")
                .setVisibility("PUBLIC")
                .build(), observer);

        assertThat(observer.error).isNull();
        assertThat(observer.completed).isTrue();
        assertThat(observer.value).isNotNull();
        assertThat(observer.value.getPost().getId()).isEqualTo(postId.toString());
        assertThat(observer.value.getPost().getAuthorId()).isEqualTo(authorId.toString());
        assertThat(observer.value.getPost().getCommentCount()).isEqualTo(2);
        assertThat(observer.value.getPost().getLikeCount()).isEqualTo(7);
        assertThat(observer.value.getPost().getLikedByMe()).isTrue();
    }

    @Test
    void createPostReturnsInvalidArgumentForBadUuid() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        CapturingObserver<CreatePostResponse> observer = new CapturingObserver<>();
        grpc.createPost(CreatePostRequest.newBuilder()
                .setAuthorId("bad-uuid")
                .setContent("hello")
                .setVisibility("PUBLIC")
                .build(), observer);

        assertThat(observer.value).isNull();
        assertThat(observer.completed).isFalse();
        assertThat(observer.statusCode()).isEqualTo(Status.INVALID_ARGUMENT.getCode());
    }

    @Test
    void createCommentMapsNotFoundWhenServiceThrowsNotFound() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        UUID authorId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        when(postService.createComment(authorId, postId, "hi"))
                .thenThrow(new PostNotFoundException(postId));

        CapturingObserver<CreateCommentResponse> observer = new CapturingObserver<>();
        grpc.createComment(CreateCommentRequest.newBuilder()
                .setAuthorId(authorId.toString())
                .setPostId(postId.toString())
                .setContent("hi")
                .build(), observer);

        assertThat(observer.statusCode()).isEqualTo(Status.NOT_FOUND.getCode());
    }

    @Test
    void getFeedReturnsPostsAndNextCursor() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        UUID userId = UUID.randomUUID();
        PostView view = new PostView(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "content",
                "PUBLIC",
                Instant.parse("2026-01-20T00:00:00Z"),
                0,
                0,
                false);
        when(feedService.loadFeed(any(UUID.class), anyString(), anyInt()))
                .thenReturn(new FeedView(List.of(view), "cursor-2"));

        CapturingObserver<FeedResponse> observer = new CapturingObserver<>();
        grpc.getFeed(FeedRequest.newBuilder()
                .setUserId(userId.toString())
                .setCursor("")
                .setLimit(10)
                .build(), observer);

        assertThat(observer.statusCode()).isNull();
        assertThat(observer.value.getPostsCount()).isEqualTo(1);
        assertThat(observer.value.getNextCursor()).isEqualTo("cursor-2");
    }

    @Test
    void getAuthorPostsDelegatesToFeedService() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        UUID authorId = UUID.randomUUID();
        UUID viewerId = UUID.randomUUID();
        when(feedService.loadByAuthor(any(UUID.class), any(UUID.class), anyString(), anyInt()))
                .thenReturn(new FeedView(List.of(), null));

        CapturingObserver<FeedResponse> observer = new CapturingObserver<>();
        grpc.getAuthorPosts(AuthorPostsRequest.newBuilder()
                .setAuthorId(authorId.toString())
                .setViewerId(viewerId.toString())
                .setCursor("")
                .setLimit(10)
                .build(), observer);

        assertThat(observer.statusCode()).isNull();
        assertThat(observer.value.getPostsCount()).isZero();
        assertThat(observer.value.getNextCursor()).isEmpty();
    }

    @Test
    void searchPostsReturnsFeedResponse() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        UUID viewerId = UUID.randomUUID();
        PostView view = new PostView(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "hello from search",
                "PUBLIC",
                Instant.parse("2026-01-20T00:00:00Z"),
                0,
                0,
                false);
        when(feedService.search(any(UUID.class), anyString(), anyString(), anyInt()))
                .thenReturn(new FeedView(List.of(view), null));

        CapturingObserver<FeedResponse> observer = new CapturingObserver<>();
        grpc.searchPosts(SearchPostsRequest.newBuilder()
                .setViewerId(viewerId.toString())
                .setQuery("hello")
                .setCursor("")
                .setLimit(10)
                .build(), observer);

        assertThat(observer.statusCode()).isNull();
        assertThat(observer.value.getPostsCount()).isEqualTo(1);
    }

    @Test
    void getPostReturnsPostAndComments() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        UUID postId = UUID.randomUUID();
        UUID viewerId = UUID.randomUUID();
        PostView view = new PostView(
                postId,
                UUID.randomUUID(),
                "content",
                "PUBLIC",
                Instant.parse("2026-01-20T00:00:00Z"),
                2,
                0,
                false);
        Comment comment1 = new Comment(UUID.randomUUID(), postId, UUID.randomUUID(), "c1",
                Instant.parse("2026-01-20T00:01:00Z"));
        Comment comment2 = new Comment(UUID.randomUUID(), postId, UUID.randomUUID(), "c2",
                Instant.parse("2026-01-20T00:02:00Z"));
        when(postService.getPostDetail(postId, viewerId))
                .thenReturn(Optional.of(new PostDetailView(view, List.of(comment1, comment2))));

        CapturingObserver<GetPostResponse> observer = new CapturingObserver<>();
        grpc.getPost(GetPostRequest.newBuilder()
                .setPostId(postId.toString())
                .setViewerId(viewerId.toString())
                .build(), observer);

        assertThat(observer.statusCode()).isNull();
        assertThat(observer.value.getPost().getId()).isEqualTo(postId.toString());
        assertThat(observer.value.getCommentsCount()).isEqualTo(2);
    }

    @Test
    void getPostReturnsNotFoundWhenMissing() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        UUID postId = UUID.randomUUID();
        UUID viewerId = UUID.randomUUID();
        when(postService.getPostDetail(postId, viewerId)).thenReturn(Optional.empty());

        CapturingObserver<GetPostResponse> observer = new CapturingObserver<>();
        grpc.getPost(GetPostRequest.newBuilder()
                .setPostId(postId.toString())
                .setViewerId(viewerId.toString())
                .build(), observer);

        assertThat(observer.statusCode()).isEqualTo(Status.NOT_FOUND.getCode());
    }

    @Test
    void likeAndUnlikeMapResponses() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        UUID postId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(postService.likePost(postId, userId)).thenReturn(new PostLikeStatus(postId, 3, true));
        when(postService.unlikePost(postId, userId)).thenReturn(new PostLikeStatus(postId, 2, false));

        CapturingObserver<LikePostResponse> likeObserver = new CapturingObserver<>();
        grpc.likePost(LikePostRequest.newBuilder()
                .setPostId(postId.toString())
                .setUserId(userId.toString())
                .build(), likeObserver);
        assertThat(likeObserver.statusCode()).isNull();
        assertThat(likeObserver.value.getLikeCount()).isEqualTo(3);
        assertThat(likeObserver.value.getLiked()).isTrue();

        CapturingObserver<UnlikePostResponse> unlikeObserver = new CapturingObserver<>();
        grpc.unlikePost(UnlikePostRequest.newBuilder()
                .setPostId(postId.toString())
                .setUserId(userId.toString())
                .build(), unlikeObserver);
        assertThat(unlikeObserver.statusCode()).isNull();
        assertThat(unlikeObserver.value.getLikeCount()).isEqualTo(2);
        assertThat(unlikeObserver.value.getLiked()).isFalse();
    }

    @Test
    void trendingDelegatesToFeedService() {
        PostService postService = mock(PostService.class);
        FeedService feedService = mock(FeedService.class);
        PostGrpcService grpc = new PostGrpcService(postService, feedService);

        UUID viewerId = UUID.randomUUID();
        when(feedService.loadTrending(any(UUID.class), anyString(), anyInt()))
                .thenReturn(new FeedView(List.of(), null));

        CapturingObserver<FeedResponse> observer = new CapturingObserver<>();
        grpc.getTrending(TrendingRequest.newBuilder()
                .setViewerId(viewerId.toString())
                .setCursor("")
                .setLimit(10)
                .build(), observer);

        assertThat(observer.statusCode()).isNull();
        assertThat(observer.value.getPostsCount()).isZero();
    }

    private static final class CapturingObserver<T> implements StreamObserver<T> {
        private T value;
        private Throwable error;
        private boolean completed;

        @Override
        public void onNext(T value) {
            this.value = value;
        }

        @Override
        public void onError(Throwable t) {
            this.error = t;
        }

        @Override
        public void onCompleted() {
            this.completed = true;
        }

        io.grpc.Status.Code statusCode() {
            return error == null ? null : io.grpc.Status.fromThrowable(error).getCode();
        }
    }
}
