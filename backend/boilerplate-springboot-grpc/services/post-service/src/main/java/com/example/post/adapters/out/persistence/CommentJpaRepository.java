package com.example.post.adapters.out.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentJpaRepository extends JpaRepository<CommentEntity, UUID> {
    List<CommentEntity> findByPostIdOrderByCommentedAtAsc(UUID postId);
}
