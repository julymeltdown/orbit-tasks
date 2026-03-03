package com.example.post.adapters.out.memory;

import com.example.post.domain.Comment;
import com.example.post.domain.Post;
import com.example.post.domain.PostDetail;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InMemoryPostRepositoryTest {
    @Test
    void incrementsCommentCountOnSave() {
        InMemoryPostRepository repository = new InMemoryPostRepository();
        UUID postId = UUID.randomUUID();
        Post post = new Post(postId, UUID.randomUUID(), "Hello world", "PUBLIC", Instant.now(), 0);
        repository.save(post);

        Comment comment = new Comment(UUID.randomUUID(), postId, UUID.randomUUID(), "Nice post", Instant.now());
        repository.save(comment);

        Optional<PostDetail> detail = repository.fetchPost(postId);
        assertTrue(detail.isPresent());
        assertEquals(1, detail.get().post().commentCount());
        assertEquals(1, detail.get().comments().size());
    }

    @Test
    void searchByContentFiltersPosts() {
        InMemoryPostRepository repository = new InMemoryPostRepository();
        repository.save(new Post(UUID.randomUUID(), UUID.randomUUID(), "Coffee time", "PUBLIC", Instant.now(), 0));
        repository.save(new Post(UUID.randomUUID(), UUID.randomUUID(), "Mountain hike", "PUBLIC", Instant.now(), 0));

        var page = repository.searchByContent("coffee", null, 10);
        assertEquals(1, page.posts().size());
        assertEquals("Coffee time", page.posts().get(0).content());
    }

    @Test
    void fetchByIdsPreservesOrder() {
        InMemoryPostRepository repository = new InMemoryPostRepository();
        Post first = new Post(UUID.randomUUID(), UUID.randomUUID(), "First", "PUBLIC", Instant.now(), 0);
        Post second = new Post(UUID.randomUUID(), UUID.randomUUID(), "Second", "PUBLIC", Instant.now(), 0);
        repository.save(first);
        repository.save(second);

        List<Post> posts = repository.fetchByIds(List.of(second.id(), first.id()));
        assertEquals(2, posts.size());
        assertEquals(second.id(), posts.get(0).id());
        assertEquals(first.id(), posts.get(1).id());
    }

    @Test
    void fetchByAuthorSupportsCursorTieBreaker() {
        InMemoryPostRepository repository = new InMemoryPostRepository();
        UUID authorId = UUID.randomUUID();
        Post newerId = new Post(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"),
                authorId,
                "newer",
                "PUBLIC",
                Instant.parse("2026-01-20T12:00:00Z"),
                0);
        Post olderId = new Post(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"),
                authorId,
                "older",
                "PUBLIC",
                Instant.parse("2026-01-20T12:00:00Z"),
                0);
        repository.save(newerId);
        repository.save(olderId);

        var firstPage = repository.fetchByAuthor(authorId, null, 1);
        var secondPage = repository.fetchByAuthor(authorId, firstPage.nextCursor(), 1);

        assertEquals(1, firstPage.posts().size());
        assertEquals("newer", firstPage.posts().get(0).content());
        assertEquals(1, secondPage.posts().size());
        assertEquals("older", secondPage.posts().get(0).content());
    }

    @Test
    void fetchByAuthorReturnsEmptyForNullAuthor() {
        InMemoryPostRepository repository = new InMemoryPostRepository();

        var page = repository.fetchByAuthor(null, null, 10);

        assertTrue(page.posts().isEmpty());
        assertEquals(null, page.nextCursor());
    }

    @Test
    void clearRemovesPostsCommentsAndLikes() {
        InMemoryPostRepository repository = new InMemoryPostRepository();
        UUID postId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        repository.save(new Post(postId, authorId, "content", "PUBLIC", Instant.parse("2026-01-20T12:00:00Z"), 0));
        repository.save(new Comment(UUID.randomUUID(), postId, UUID.randomUUID(), "comment", Instant.now()));
        repository.adjustLikeCount(postId, 5);
        repository.clear();

        assertTrue(repository.fetchByAuthor(authorId, null, 10).posts().isEmpty());
        assertTrue(repository.fetchPost(postId).isEmpty());
    }

    @Test
    void fetchPostReturnsEmptyForNullAndUnknownPost() {
        InMemoryPostRepository repository = new InMemoryPostRepository();

        assertTrue(repository.fetchPost(null).isEmpty());
        assertFalse(repository.fetchPost(UUID.randomUUID()).isPresent());
    }
}
