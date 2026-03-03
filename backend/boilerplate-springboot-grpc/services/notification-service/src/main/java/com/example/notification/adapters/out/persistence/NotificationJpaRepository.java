package com.example.notification.adapters.out.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationJpaRepository extends JpaRepository<NotificationEntity, String> {
    Optional<NotificationEntity> findByRecipientUserIdAndEventIdAndType(String recipientUserId,
                                                                         String eventId,
                                                                         String type);

    Optional<NotificationEntity> findByRecipientUserIdAndId(String recipientUserId, String id);

    @Query("""
            select n
            from NotificationEntity n
            where n.recipientUserId = :recipientUserId
              and (
                    :cursorCreatedAt is null
                    or n.createdAt < :cursorCreatedAt
                    or (n.createdAt = :cursorCreatedAt and n.id < :cursorId)
              )
            order by n.createdAt desc, n.id desc
            """)
    List<NotificationEntity> findPage(@Param("recipientUserId") String recipientUserId,
                                      @Param("cursorCreatedAt") Instant cursorCreatedAt,
                                      @Param("cursorId") String cursorId,
                                      Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update NotificationEntity n
            set n.readAt = :readAt
            where n.recipientUserId = :recipientUserId
              and n.id = :notificationId
              and n.readAt is null
            """)
    int markRead(@Param("recipientUserId") String recipientUserId,
                 @Param("notificationId") String notificationId,
                 @Param("readAt") Instant readAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update NotificationEntity n
            set n.readAt = :readAt
            where n.recipientUserId = :recipientUserId
              and n.readAt is null
            """)
    int markAllRead(@Param("recipientUserId") String recipientUserId,
                    @Param("readAt") Instant readAt);
}
