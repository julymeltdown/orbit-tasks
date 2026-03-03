package com.example.post.adapters.out.memory;

import com.example.post.application.port.out.PostRepositoryPort;
import com.example.post.domain.Comment;
import com.example.post.domain.FeedPage;
import com.example.post.domain.Post;
import com.example.post.domain.PostCursor;
import com.example.post.domain.PostDetail;
import com.example.post.domain.TrendingCursor;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;
import java.util.stream.Stream;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "test"})
@ConditionalOnProperty(name = "post.persistence.mode", havingValue = "memory")
public class InMemoryPostRepository implements PostRepositoryPort {
    private final CopyOnWriteArrayList<Post> posts = new CopyOnWriteArrayList<>();
    private final Map<UUID, CopyOnWriteArrayList<Comment>> comments = new ConcurrentHashMap<>();
    private final Map<UUID, AtomicLong> likeCounts = new ConcurrentHashMap<>();

    @Override
    public Post save(Post post) {
        posts.add(post);
        likeCounts.putIfAbsent(post.id(), new AtomicLong(0L));
        return post;
    }

    @Override
    public Comment save(Comment comment) {
        comments.computeIfAbsent(comment.postId(), id -> new CopyOnWriteArrayList<>())
                .add(comment);
        incrementCommentCount(comment.postId());
        return comment;
    }

    @Override
    public FeedPage fetchFeed(List<UUID> authorIds, String cursor, int limit) {
        return slicePosts(authorIds, cursor, limit);
    }

    @Override
    public FeedPage fetchByAuthor(UUID authorId, String cursor, int limit) {
        if (authorId == null) {
            return new FeedPage(List.of(), null);
        }
        return slicePosts(List.of(authorId), cursor, limit);
    }

    @Override
    public FeedPage searchByContent(String query, String cursor, int limit) {
        if (query == null || query.isBlank()) {
            return new FeedPage(List.of(), null);
        }
        String needle = query.toLowerCase();
        int pageLimit = limit > 0 ? limit : 10;
        PostCursor postCursor = PostCursor.parse(cursor);
        Stream<Post> stream = posts.stream()
                .filter(post -> post.content() != null && post.content().toLowerCase().contains(needle));
        if (postCursor != null) {
            stream = stream.filter(post -> isBeforeCursor(post, postCursor));
        }
        return page(stream.sorted(postComparator()), pageLimit, post -> PostCursor.from(post).encode());
    }

    @Override
    public FeedPage fetchTrending(String cursor, int limit) {
        int pageLimit = limit > 0 ? limit : 10;
        TrendingCursor trendingCursor = TrendingCursor.parse(cursor);
        Stream<Post> stream = posts.stream();
        if (trendingCursor != null) {
            stream = stream.filter(post -> isBeforeTrendingCursor(post, trendingCursor));
        }
        return page(
                stream.sorted(trendingComparator()),
                pageLimit,
                post -> TrendingCursor.from(post, countLike(post.id())).encode()
        );
    }

    @Override
    public List<Post> fetchByIds(List<UUID> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return List.of();
        }
        Map<UUID, Post> index = new HashMap<>();
        for (Post post : posts) {
            index.put(post.id(), post);
        }
        return postIds.stream()
                .filter(Objects::nonNull)
                .map(index::get)
                .filter(Objects::nonNull)
                .toList();
    }

    @Override
    public Optional<PostDetail> fetchPost(UUID postId) {
        if (postId == null) {
            return Optional.empty();
        }
        Post post = posts.stream()
                .filter(candidate -> candidate.id().equals(postId))
                .findFirst()
                .orElse(null);
        if (post == null) {
            return Optional.empty();
        }
        List<Comment> postComments = comments.getOrDefault(postId, new CopyOnWriteArrayList<>()).stream()
                .sorted(Comparator.comparing(Comment::createdAt))
                .toList();
        return Optional.of(new PostDetail(post, postComments));
    }

    @Override
    public void adjustLikeCount(UUID postId, long delta) {
        if (postId == null || delta == 0L) {
            return;
        }
        likeCounts.compute(postId, (id, current) -> {
            AtomicLong counter = current != null ? current : new AtomicLong(0L);
            counter.updateAndGet(value -> {
                long updated = value + delta;
                return Math.max(0L, updated);
            });
            return counter;
        });
    }

    @Override
    public void clear() {
        posts.clear();
        comments.clear();
        likeCounts.clear();
    }

    private FeedPage slicePosts(List<UUID> authorIds, String cursor, int limit) {
        if (authorIds == null || authorIds.isEmpty()) {
            return new FeedPage(List.of(), null);
        }
        int pageLimit = limit > 0 ? limit : 10;
        PostCursor postCursor = PostCursor.parse(cursor);
        Stream<Post> stream = posts.stream()
                .filter(post -> authorIds.contains(post.authorId()));
        if (postCursor != null) {
            stream = stream.filter(post -> isBeforeCursor(post, postCursor));
        }
        return page(stream.sorted(postComparator()), pageLimit, post -> PostCursor.from(post).encode());
    }

    private void incrementCommentCount(UUID postId) {
        for (int index = 0; index < posts.size(); index++) {
            Post post = posts.get(index);
            if (post.id().equals(postId)) {
                posts.set(index, new Post(
                        post.id(),
                        post.authorId(),
                        post.content(),
                        post.visibility(),
                        post.createdAt(),
                        post.commentCount() + 1L
                ));
                return;
            }
        }
    }

    private FeedPage page(Stream<Post> sortedStream, int pageLimit, Function<Post, String> cursorEncoder) {
        List<Post> window = sortedStream.limit(pageLimit + 1L).toList();
        boolean hasMore = window.size() > pageLimit;
        List<Post> page = hasMore ? window.subList(0, pageLimit) : window;
        String nextCursor = null;
        if (hasMore && !page.isEmpty()) {
            Post last = page.get(page.size() - 1);
            nextCursor = cursorEncoder.apply(last);
        }
        return new FeedPage(List.copyOf(page), nextCursor);
    }

    private boolean isBeforeCursor(Post post, PostCursor cursor) {
        int createdCompare = post.createdAt().compareTo(cursor.createdAt());
        if (createdCompare < 0) {
            return true;
        }
        if (createdCompare > 0) {
            return false;
        }
        return post.id().compareTo(cursor.postId()) < 0;
    }

    private boolean isBeforeTrendingCursor(Post post, TrendingCursor cursor) {
        long likeCount = countLike(post.id());
        if (likeCount < cursor.likeCount()) {
            return true;
        }
        if (likeCount > cursor.likeCount()) {
            return false;
        }
        int createdCompare = post.createdAt().compareTo(cursor.createdAt());
        if (createdCompare < 0) {
            return true;
        }
        if (createdCompare > 0) {
            return false;
        }
        return post.id().compareTo(cursor.postId()) < 0;
    }

    private Comparator<Post> postComparator() {
        return Comparator.comparing(Post::createdAt, Comparator.reverseOrder())
                .thenComparing(Post::id, Comparator.reverseOrder());
    }

    private Comparator<Post> trendingComparator() {
        return Comparator.comparingLong((Post post) -> countLike(post.id())).reversed()
                .thenComparing(Post::createdAt, Comparator.reverseOrder())
                .thenComparing(Post::id, Comparator.reverseOrder());
    }

    private long countLike(UUID postId) {
        AtomicLong counter = likeCounts.get(postId);
        return counter == null ? 0L : counter.get();
    }

}
