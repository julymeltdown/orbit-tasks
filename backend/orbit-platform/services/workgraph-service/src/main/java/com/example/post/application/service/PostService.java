package com.example.post.application.service;

import com.example.post.application.port.out.FeedCachePort;
import com.example.post.application.port.out.FriendClientPort;
import com.example.post.application.port.out.PostCachePort;
import com.example.post.application.port.out.PostLikeRepositoryPort;
import com.example.post.application.port.out.PostRepositoryPort;
import com.example.post.domain.Comment;
import com.example.post.domain.Post;
import com.example.post.domain.PostDetailView;
import com.example.post.domain.PostLikeStatus;
import com.example.post.domain.PostNotFoundException;
import com.example.post.domain.PostView;
import com.example.post.domain.event.PostCommentedEvent;
import com.example.post.domain.event.PostCreatedEvent;
import com.example.post.domain.event.PostLikedEvent;
import com.example.post.domain.event.PostUnlikedEvent;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {
    private final PostRepositoryPort postRepository;
    private final PostLikeRepositoryPort likeRepository;
    private final FeedCachePort feedCache;
    private final PostCachePort postCache;
    private final FriendClientPort friendClient;
    private final Clock clock;
    private final int fanoutThreshold;
    private final ApplicationEventPublisher eventPublisher;

    public PostService(PostRepositoryPort postRepository,
                       PostLikeRepositoryPort likeRepository,
                       FeedCachePort feedCache,
                       PostCachePort postCache,
                       FriendClientPort friendClient,
                       Clock clock,
                       @Value("${post.feed.fanout-threshold:0}") int fanoutThreshold,
                       ApplicationEventPublisher eventPublisher) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.feedCache = feedCache;
        this.postCache = postCache;
        this.friendClient = friendClient;
        this.clock = clock;
        this.fanoutThreshold = fanoutThreshold;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public PostView createPost(UUID authorId, String content, String visibility) {
        UUID postId = UUID.randomUUID();
        Instant createdAt = clock.instant();
        Post post = new Post(postId, authorId, content, visibility, createdAt, 0L);
        postRepository.save(post);
        postCache.store(post);
        feedCache.pushToFeed(authorId, post);
        List<UUID> followerIds = friendClient.fetchFollowerIds(authorId);
        if (fanoutThreshold <= 0 || followerIds.size() <= fanoutThreshold) {
            feedCache.pushToFeeds(followerIds, post);
        }
        eventPublisher.publishEvent(new PostCreatedEvent(
                UUID.randomUUID(),
                postId,
                authorId,
                content,
                visibility,
                createdAt,
                createdAt
        ));
        return toView(post, authorId);
    }

    @Transactional
    public Comment createComment(UUID authorId, UUID postId, String content) {
        requirePost(postId);
        UUID commentId = UUID.randomUUID();
        Instant createdAt = clock.instant();
        Comment comment = new Comment(commentId, postId, authorId, content, createdAt);
        postRepository.save(comment);
        postRepository.fetchPost(postId).ifPresent(detail -> postCache.store(detail.post()));
        eventPublisher.publishEvent(new PostCommentedEvent(
                UUID.randomUUID(),
                postId,
                commentId,
                authorId,
                content,
                createdAt,
                createdAt
        ));
        return comment;
    }

    public Optional<PostDetailView> getPostDetail(UUID postId, UUID viewerId) {
        return postRepository.fetchPost(postId)
                .map(detail -> new PostDetailView(
                        toView(detail.post(), viewerId),
                        detail.comments()
                ));
    }

    @Transactional
    public PostLikeStatus likePost(UUID postId, UUID userId) {
        requirePost(postId);
        boolean added = likeRepository.addLike(postId, userId);
        if (added) {
            postRepository.adjustLikeCount(postId, 1L);
        }
        long likeCount = likeRepository.countLikes(postId);
        eventPublisher.publishEvent(new PostLikedEvent(
                UUID.randomUUID(),
                postId,
                userId,
                likeCount,
                clock.instant()
        ));
        return new PostLikeStatus(postId, likeCount, true);
    }

    @Transactional
    public PostLikeStatus unlikePost(UUID postId, UUID userId) {
        requirePost(postId);
        boolean removed = likeRepository.removeLike(postId, userId);
        if (removed) {
            postRepository.adjustLikeCount(postId, -1L);
        }
        long likeCount = likeRepository.countLikes(postId);
        eventPublisher.publishEvent(new PostUnlikedEvent(
                UUID.randomUUID(),
                postId,
                userId,
                likeCount,
                clock.instant()
        ));
        return new PostLikeStatus(postId, likeCount, false);
    }

    private void requirePost(UUID postId) {
        if (postRepository.fetchPost(postId).isEmpty()) {
            throw new PostNotFoundException(postId);
        }
    }

    private PostView toView(Post post, UUID viewerId) {
        long likeCount = likeRepository.countLikes(post.id());
        boolean likedByViewer = likeRepository.findLikedPostIds(viewerId, List.of(post.id())).contains(post.id());
        return new PostView(
                post.id(),
                post.authorId(),
                post.content(),
                post.visibility(),
                post.createdAt(),
                post.commentCount(),
                likeCount,
                likedByViewer
        );
    }
}
