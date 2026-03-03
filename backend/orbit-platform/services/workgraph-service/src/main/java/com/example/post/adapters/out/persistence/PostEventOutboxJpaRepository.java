package com.example.post.adapters.out.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostEventOutboxJpaRepository extends JpaRepository<PostEventOutboxEntity, UUID> {
    List<PostEventOutboxEntity> findByPublishedFalseAndCreatedAtBefore(Instant createdAt, Pageable pageable);
}
