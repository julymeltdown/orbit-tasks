package com.example.post.adapters.out.persistence;

import com.example.post.application.port.out.PostRepositoryPort;
import com.example.post.domain.Comment;
import com.example.post.domain.FeedPage;
import com.example.post.domain.Post;
import com.example.post.domain.PostCursor;
import com.example.post.domain.PostDetail;
import com.example.post.domain.TrendingCursor;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@ConditionalOnProperty(name = "post.persistence.mode", havingValue = "jpa", matchIfMissing = true)
public class JpaPostRepositoryAdapter implements PostRepositoryPort {
    private final PostJpaRepository postJpaRepository;
    private final CommentJpaRepository commentJpaRepository;

    public JpaPostRepositoryAdapter(PostJpaRepository postJpaRepository,
                                    CommentJpaRepository commentJpaRepository) {
        this.postJpaRepository = postJpaRepository;
        this.commentJpaRepository = commentJpaRepository;
    }

    @Override
    @Transactional
    public Post save(Post post) {
        PostEntity entity = toPostEntity(post);
        PostEntity saved = postJpaRepository.save(entity);
        return toPost(saved);
    }

    @Override
    @Transactional
    public Comment save(Comment comment) {
        commentJpaRepository.save(toCommentEntity(comment));
        postJpaRepository.incrementCommentCount(comment.postId());
        return comment;
    }

    @Override
    @Transactional(readOnly = true)
    public FeedPage fetchFeed(List<UUID> authorIds, String cursor, int limit) {
        if (authorIds == null || authorIds.isEmpty()) {
            return new FeedPage(List.of(), null);
        }
        int resolvedLimit = resolveLimit(limit);
        PostCursor postCursor = PostCursor.parse(cursor);
        return toFeedPage(postJpaRepository.fetchFeed(
                authorIds,
                postCursor == null ? null : postCursor.createdAt(),
                postCursor == null ? null : postCursor.postId(),
                page(resolvedLimit + 1)), resolvedLimit);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedPage fetchByAuthor(UUID authorId, String cursor, int limit) {
        if (authorId == null) {
            return new FeedPage(List.of(), null);
        }
        int resolvedLimit = resolveLimit(limit);
        PostCursor postCursor = PostCursor.parse(cursor);
        return toFeedPage(postJpaRepository.fetchByAuthor(
                authorId,
                postCursor == null ? null : postCursor.createdAt(),
                postCursor == null ? null : postCursor.postId(),
                page(resolvedLimit + 1)), resolvedLimit);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedPage searchByContent(String query, String cursor, int limit) {
        if (query == null || query.isBlank()) {
            return new FeedPage(List.of(), null);
        }
        int resolvedLimit = resolveLimit(limit);
        PostCursor postCursor = PostCursor.parse(cursor);
        return toFeedPage(postJpaRepository.searchByContent(
                query.trim(),
                postCursor == null ? null : postCursor.createdAt(),
                postCursor == null ? null : postCursor.postId(),
                page(resolvedLimit + 1)), resolvedLimit);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedPage fetchTrending(String cursor, int limit) {
        int resolvedLimit = resolveLimit(limit);
        TrendingCursor trendingCursor = TrendingCursor.parse(cursor);
        return toTrendingPage(postJpaRepository.fetchTrending(
                trendingCursor == null ? null : trendingCursor.likeCount(),
                trendingCursor == null ? null : trendingCursor.createdAt(),
                trendingCursor == null ? null : trendingCursor.postId(),
                page(resolvedLimit + 1)), resolvedLimit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> fetchByIds(List<UUID> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return List.of();
        }
        List<PostEntity> entities = postJpaRepository.findByIdIn(postIds);
        Map<UUID, Post> byId = new HashMap<>();
        for (PostEntity entity : entities) {
            byId.put(entity.getId(), toPost(entity));
        }
        return postIds.stream()
                .map(byId::get)
                .filter(post -> post != null)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PostDetail> fetchPost(UUID postId) {
        if (postId == null) {
            return Optional.empty();
        }
        return postJpaRepository.findById(postId)
                .map(entity -> {
                    List<Comment> comments = commentJpaRepository.findByPostIdOrderByCommentedAtAsc(postId).stream()
                            .map(this::toComment)
                            .toList();
                    return new PostDetail(toPost(entity), comments);
                });
    }

    @Override
    @Transactional
    public void adjustLikeCount(UUID postId, long delta) {
        if (postId == null || delta == 0L) {
            return;
        }
        postJpaRepository.adjustLikeCount(postId, delta);
    }

    @Override
    @Transactional
    public void clear() {
        commentJpaRepository.deleteAllInBatch();
        postJpaRepository.deleteAllInBatch();
    }

    private FeedPage toFeedPage(List<PostEntity> entities, int pageLimit) {
        if (entities == null || entities.isEmpty()) {
            return new FeedPage(List.of(), null);
        }
        boolean hasMore = entities.size() > pageLimit;
        List<PostEntity> pageEntities = hasMore ? entities.subList(0, pageLimit) : entities;
        List<Post> posts = pageEntities.stream().map(this::toPost).toList();
        String nextCursor = null;
        if (hasMore && !posts.isEmpty()) {
            nextCursor = PostCursor.from(posts.get(posts.size() - 1)).encode();
        }
        return new FeedPage(posts, nextCursor);
    }

    private FeedPage toTrendingPage(List<PostEntity> entities, int pageLimit) {
        if (entities == null || entities.isEmpty()) {
            return new FeedPage(List.of(), null);
        }
        boolean hasMore = entities.size() > pageLimit;
        List<PostEntity> pageEntities = hasMore ? entities.subList(0, pageLimit) : entities;
        List<Post> posts = pageEntities.stream().map(this::toPost).toList();
        String nextCursor = null;
        if (hasMore && !pageEntities.isEmpty()) {
            PostEntity last = pageEntities.get(pageEntities.size() - 1);
            nextCursor = new TrendingCursor(last.getLikeCount(), last.getPostedAt(), last.getId()).encode();
        }
        return new FeedPage(posts, nextCursor);
    }

    private PageRequest page(int requestedSize) {
        int safeSize = requestedSize > 0 ? requestedSize : 10;
        return PageRequest.of(0, safeSize);
    }

    private int resolveLimit(int limit) {
        return limit > 0 ? limit : 10;
    }

    private PostEntity toPostEntity(Post post) {
        PostEntity entity = new PostEntity();
        entity.setId(post.id());
        entity.setAuthorId(post.authorId());
        entity.setContent(post.content());
        entity.setVisibility(post.visibility());
        entity.setPostedAt(post.createdAt());
        entity.setCommentCount(post.commentCount());
        entity.setLikeCount(0L);
        return entity;
    }

    private CommentEntity toCommentEntity(Comment comment) {
        CommentEntity entity = new CommentEntity();
        entity.setId(comment.id());
        entity.setPostId(comment.postId());
        entity.setAuthorId(comment.authorId());
        entity.setContent(comment.content());
        entity.setCommentedAt(comment.createdAt());
        return entity;
    }

    private Post toPost(PostEntity entity) {
        return new Post(
                entity.getId(),
                entity.getAuthorId(),
                entity.getContent(),
                entity.getVisibility(),
                entity.getPostedAt(),
                entity.getCommentCount()
        );
    }

    private Comment toComment(CommentEntity entity) {
        return new Comment(
                entity.getId(),
                entity.getPostId(),
                entity.getAuthorId(),
                entity.getContent(),
                entity.getCommentedAt()
        );
    }
}
