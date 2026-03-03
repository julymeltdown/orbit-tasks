package com.example.post.adapters.out.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.example.post.config.audit.AuditingConfig;
import com.example.post.config.audit.AuditorAwareConfig;
import com.example.post.domain.Comment;
import com.example.post.domain.FeedPage;
import com.example.post.domain.Post;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Import({JpaPostRepositoryAdapter.class, AuditingConfig.class, AuditorAwareConfig.class})
class JpaPostRepositoryAdapterTest {
    @Autowired
    private JpaPostRepositoryAdapter adapter;

    @BeforeEach
    void cleanState() {
        adapter.clear();
    }

    @Test
    void savesAndFetchesPostDetail() {
        UUID postId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        Post saved = adapter.save(new Post(
                postId,
                authorId,
                "Persistence works",
                "PUBLIC",
                Instant.parse("2026-01-20T11:00:00Z"),
                0L));

        assertEquals(postId, saved.id());
        assertEquals(authorId, saved.authorId());

        var detail = adapter.fetchPost(postId).orElseThrow();
        assertEquals(postId, detail.post().id());
        assertEquals("Persistence works", detail.post().content());
        assertTrue(detail.comments().isEmpty());
    }

    @Test
    void incrementsCommentCountWhenSavingComment() {
        UUID postId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        adapter.save(new Post(
                postId,
                authorId,
                "Post with comments",
                "PUBLIC",
                Instant.parse("2026-01-20T11:00:00Z"),
                0L));

        adapter.save(new Comment(
                UUID.randomUUID(),
                postId,
                UUID.randomUUID(),
                "first",
                Instant.parse("2026-01-20T11:01:00Z")));
        adapter.save(new Comment(
                UUID.randomUUID(),
                postId,
                UUID.randomUUID(),
                "second",
                Instant.parse("2026-01-20T11:02:00Z")));

        var detail = adapter.fetchPost(postId).orElseThrow();
        assertEquals(2L, detail.post().commentCount());
        assertEquals(2, detail.comments().size());
        assertEquals("first", detail.comments().get(0).content());
        assertEquals("second", detail.comments().get(1).content());
    }

    @Test
    void fetchFeedSupportsCursorAndLimit() {
        UUID authorId = UUID.randomUUID();
        adapter.save(post(authorId, "p1", "2026-01-20T11:03:00Z"));
        adapter.save(post(authorId, "p2", "2026-01-20T11:02:00Z"));
        adapter.save(post(authorId, "p3", "2026-01-20T11:01:00Z"));

        FeedPage first = adapter.fetchFeed(List.of(authorId), null, 2);
        assertEquals(2, first.posts().size());
        assertNotNull(first.nextCursor());

        FeedPage second = adapter.fetchFeed(List.of(authorId), first.nextCursor(), 2);
        assertEquals(1, second.posts().size());
        assertEquals("p3", second.posts().get(0).content());
    }

    @Test
    void searchByContentIsCaseInsensitive() {
        UUID authorId = UUID.randomUUID();
        adapter.save(post(authorId, "Spring gRPC with PostgreSQL", "2026-01-20T11:03:00Z"));
        adapter.save(post(authorId, "nothing to see", "2026-01-20T11:02:00Z"));

        FeedPage page = adapter.searchByContent("postgresql", null, 10);
        assertEquals(1, page.posts().size());
        assertTrue(page.posts().get(0).content().contains("PostgreSQL"));
    }

    @Test
    void feedCursorHandlesSameTimestampWithPostIdTieBreaker() {
        UUID authorId = UUID.randomUUID();
        Post laterId = new Post(
                UUID.fromString("aaaaaaaa-0000-0000-0000-000000000002"),
                authorId,
                "same-ts-2",
                "PUBLIC",
                Instant.parse("2026-01-20T12:00:00Z"),
                0L
        );
        Post earlierId = new Post(
                UUID.fromString("aaaaaaaa-0000-0000-0000-000000000001"),
                authorId,
                "same-ts-1",
                "PUBLIC",
                Instant.parse("2026-01-20T12:00:00Z"),
                0L
        );
        adapter.save(laterId);
        adapter.save(earlierId);

        FeedPage first = adapter.fetchFeed(List.of(authorId), null, 1);
        FeedPage second = adapter.fetchFeed(List.of(authorId), first.nextCursor(), 1);

        assertEquals(1, first.posts().size());
        assertEquals("same-ts-2", first.posts().get(0).content());
        assertEquals(1, second.posts().size());
        assertEquals("same-ts-1", second.posts().get(0).content());
        assertNull(second.nextCursor());
    }

    @Test
    void fetchTrendingUsesPersistedLikeCounter() {
        UUID authorId = UUID.randomUUID();
        Post hot = post(authorId, "hot", "2026-01-20T11:03:00Z");
        Post warm = post(authorId, "warm", "2026-01-20T11:02:00Z");
        adapter.save(hot);
        adapter.save(warm);

        adapter.adjustLikeCount(hot.id(), 5);
        adapter.adjustLikeCount(warm.id(), 2);

        FeedPage page = adapter.fetchTrending(null, 10);
        assertEquals(2, page.posts().size());
        assertEquals(hot.id(), page.posts().get(0).id());
        assertEquals(warm.id(), page.posts().get(1).id());
    }

    @Test
    void fetchByAuthorSupportsCursorAndNullAuthorGuard() {
        UUID authorId = UUID.randomUUID();
        adapter.save(post(authorId, "author-1", "2026-01-20T11:03:00Z"));
        adapter.save(post(authorId, "author-2", "2026-01-20T11:02:00Z"));

        FeedPage first = adapter.fetchByAuthor(authorId, null, 1);
        FeedPage second = adapter.fetchByAuthor(authorId, first.nextCursor(), 1);
        FeedPage empty = adapter.fetchByAuthor(null, null, 10);

        assertEquals(1, first.posts().size());
        assertEquals(1, second.posts().size());
        assertEquals(0, empty.posts().size());
    }

    @Test
    void fetchByIdsKeepsRequestOrderAndSkipsUnknown() {
        UUID authorId = UUID.randomUUID();
        Post first = post(authorId, "first-ordered", "2026-01-20T11:01:00Z");
        Post second = post(authorId, "second-ordered", "2026-01-20T11:02:00Z");
        adapter.save(first);
        adapter.save(second);

        UUID unknown = UUID.randomUUID();
        List<Post> posts = adapter.fetchByIds(List.of(second.id(), unknown, first.id()));

        assertEquals(2, posts.size());
        assertEquals(second.id(), posts.get(0).id());
        assertEquals(first.id(), posts.get(1).id());
    }

    @Test
    void clearRemovesPersistedPostsAndComments() {
        UUID authorId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        adapter.save(new Post(
                postId,
                authorId,
                "to-be-cleared",
                "PUBLIC",
                Instant.parse("2026-01-20T11:00:00Z"),
                0L));
        adapter.save(new Comment(
                UUID.randomUUID(),
                postId,
                authorId,
                "comment",
                Instant.parse("2026-01-20T11:01:00Z")));

        adapter.clear();

        assertTrue(adapter.fetchPost(postId).isEmpty());
    }

    private Post post(UUID authorId, String content, String createdAt) {
        return new Post(
                UUID.randomUUID(),
                authorId,
                content,
                "PUBLIC",
                Instant.parse(createdAt),
                0L
        );
    }
}
