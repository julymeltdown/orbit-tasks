package com.example.post.adapters.out.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostJpaRepository extends JpaRepository<PostEntity, UUID> {
    @Query("""
            select p
            from PostEntity p
            where p.authorId in :authorIds
              and (
                    :cursorCreatedAt is null
                    or p.postedAt < :cursorCreatedAt
                    or (p.postedAt = :cursorCreatedAt and p.id < :cursorPostId)
                  )
            order by p.postedAt desc, p.id desc
            """)
    List<PostEntity> fetchFeed(@Param("authorIds") List<UUID> authorIds,
                               @Param("cursorCreatedAt") Instant cursorCreatedAt,
                               @Param("cursorPostId") UUID cursorPostId,
                               Pageable pageable);

    @Query("""
            select p
            from PostEntity p
            where p.authorId = :authorId
              and (
                    :cursorCreatedAt is null
                    or p.postedAt < :cursorCreatedAt
                    or (p.postedAt = :cursorCreatedAt and p.id < :cursorPostId)
                  )
            order by p.postedAt desc, p.id desc
            """)
    List<PostEntity> fetchByAuthor(@Param("authorId") UUID authorId,
                                   @Param("cursorCreatedAt") Instant cursorCreatedAt,
                                   @Param("cursorPostId") UUID cursorPostId,
                                   Pageable pageable);

    @Query("""
            select p
            from PostEntity p
            where lower(p.content) like lower(concat('%', :query, '%'))
              and (
                    :cursorCreatedAt is null
                    or p.postedAt < :cursorCreatedAt
                    or (p.postedAt = :cursorCreatedAt and p.id < :cursorPostId)
                  )
            order by p.postedAt desc, p.id desc
            """)
    List<PostEntity> searchByContent(@Param("query") String query,
                                     @Param("cursorCreatedAt") Instant cursorCreatedAt,
                                     @Param("cursorPostId") UUID cursorPostId,
                                     Pageable pageable);

    @Query("""
            select p
            from PostEntity p
            where (
                    :cursorLikeCount is null
                    or p.likeCount < :cursorLikeCount
                    or (p.likeCount = :cursorLikeCount and p.postedAt < :cursorPostedAt)
                    or (p.likeCount = :cursorLikeCount and p.postedAt = :cursorPostedAt and p.id < :cursorPostId)
                  )
            order by p.likeCount desc, p.postedAt desc, p.id desc
            """)
    List<PostEntity> fetchTrending(@Param("cursorLikeCount") Long cursorLikeCount,
                                   @Param("cursorPostedAt") Instant cursorPostedAt,
                                   @Param("cursorPostId") UUID cursorPostId,
                                   Pageable pageable);

    List<PostEntity> findByIdIn(List<UUID> ids);

    List<PostEntity> findAllByOrderByPostedAtDesc();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update PostEntity p
            set p.commentCount = p.commentCount + 1
            where p.id = :postId
            """)
    int incrementCommentCount(@Param("postId") UUID postId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update PostEntity p
            set p.likeCount =
                case
                    when p.likeCount + :delta < 0 then 0
                    else p.likeCount + :delta
                end
            where p.id = :postId
            """)
    int adjustLikeCount(@Param("postId") UUID postId, @Param("delta") long delta);
}
