package com.example.post.application.port.out;

import com.example.post.domain.Comment;
import com.example.post.domain.FeedPage;
import com.example.post.domain.PostDetail;
import com.example.post.domain.Post;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepositoryPort {
    Post save(Post post);

    Comment save(Comment comment);

    FeedPage fetchFeed(List<UUID> authorIds, String cursor, int limit);

    FeedPage fetchByAuthor(UUID authorId, String cursor, int limit);

    FeedPage searchByContent(String query, String cursor, int limit);

    FeedPage fetchTrending(String cursor, int limit);

    List<Post> fetchByIds(List<UUID> postIds);

    Optional<PostDetail> fetchPost(UUID postId);

    void adjustLikeCount(UUID postId, long delta);

    void clear();
}
