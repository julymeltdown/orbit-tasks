package com.example.friend.adapters.out.memory;

import com.example.friend.application.port.out.FollowRepositoryPort;
import com.example.friend.domain.FollowCounts;
import com.example.friend.domain.FollowEdge;
import com.example.friend.domain.FollowPage;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableSet;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentSkipListSet;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "test"})
public class InMemoryFollowRepository implements FollowRepositoryPort {
    private static final Comparator<FollowEdge> EDGE_COMPARATOR = Comparator
            .comparing(FollowEdge::createdAt).reversed()
            .thenComparing(edge -> edge.followerId().toString())
            .thenComparing(edge -> edge.followeeId().toString());

    private final Map<String, FollowEdge> edgesByKey = new ConcurrentHashMap<>();
    private final Map<UUID, NavigableSet<FollowEdge>> followersByUser = new ConcurrentHashMap<>();
    private final Map<UUID, NavigableSet<FollowEdge>> followingByUser = new ConcurrentHashMap<>();
    private final Map<UUID, Long> followerCounts = new ConcurrentHashMap<>();
    private final Map<UUID, Long> followingCounts = new ConcurrentHashMap<>();
    private final ReadWriteLock lock = new ReentrantReadWriteLock();

    @Override
    public Optional<FollowEdge> follow(FollowEdge edge) {
        String key = key(edge.followerId(), edge.followeeId());
        lock.writeLock().lock();
        try {
            FollowEdge existing = edgesByKey.get(key);
            if (existing != null) {
                return Optional.of(existing);
            }
            edgesByKey.put(key, edge);
            followersByUser.computeIfAbsent(edge.followeeId(), this::newSet).add(edge);
            followingByUser.computeIfAbsent(edge.followerId(), this::newSet).add(edge);
            followerCounts.merge(edge.followeeId(), 1L, Long::sum);
            followingCounts.merge(edge.followerId(), 1L, Long::sum);
            return Optional.empty();
        } finally {
            lock.writeLock().unlock();
        }
    }

    @Override
    public boolean unfollow(UUID followerId, UUID followeeId) {
        String key = key(followerId, followeeId);
        lock.writeLock().lock();
        try {
            FollowEdge removed = edgesByKey.remove(key);
            if (removed == null) {
                return false;
            }
            NavigableSet<FollowEdge> followers = followersByUser.get(removed.followeeId());
            if (followers != null) {
                followers.remove(removed);
                if (followers.isEmpty()) {
                    followersByUser.remove(removed.followeeId());
                }
            }
            NavigableSet<FollowEdge> following = followingByUser.get(removed.followerId());
            if (following != null) {
                following.remove(removed);
                if (following.isEmpty()) {
                    followingByUser.remove(removed.followerId());
                }
            }
            decrementCount(followerCounts, removed.followeeId());
            decrementCount(followingCounts, removed.followerId());
            return true;
        } finally {
            lock.writeLock().unlock();
        }
    }

    @Override
    public FollowPage listFollowers(UUID userId, String cursor, int limit) {
        long total = followerCounts.getOrDefault(userId, 0L);
        return sliceEdges(followersByUser.get(userId), cursor, limit, CursorType.FOLLOWER, total);
    }

    @Override
    public FollowPage listFollowing(UUID userId, String cursor, int limit) {
        long total = followingCounts.getOrDefault(userId, 0L);
        return sliceEdges(followingByUser.get(userId), cursor, limit, CursorType.FOLLOWEE, total);
    }

    @Override
    public boolean isFollowing(UUID followerId, UUID followeeId) {
        return edgesByKey.containsKey(key(followerId, followeeId));
    }

    @Override
    public FollowCounts counts(UUID userId) {
        lock.readLock().lock();
        try {
            long followerCount = followerCounts.getOrDefault(userId, 0L);
            long followingCount = followingCounts.getOrDefault(userId, 0L);
            return new FollowCounts(followerCount, followingCount);
        } finally {
            lock.readLock().unlock();
        }
    }

    @Override
    public Map<UUID, FollowCounts> batchCounts(Iterable<UUID> userIds) {
        lock.readLock().lock();
        try {
            Map<UUID, FollowCounts> result = new HashMap<>();
            if (userIds == null) {
                return result;
            }
            for (UUID userId : userIds) {
                if (userId == null) {
                    continue;
                }
                long followerCount = followerCounts.getOrDefault(userId, 0L);
                long followingCount = followingCounts.getOrDefault(userId, 0L);
                result.put(userId, new FollowCounts(followerCount, followingCount));
            }
            return result;
        } finally {
            lock.readLock().unlock();
        }
    }

    @Override
    public void clear() {
        lock.writeLock().lock();
        try {
            edgesByKey.clear();
            followersByUser.clear();
            followingByUser.clear();
            followerCounts.clear();
            followingCounts.clear();
        } finally {
            lock.writeLock().unlock();
        }
    }

    private FollowPage sliceEdges(NavigableSet<FollowEdge> edges,
                                  String cursor,
                                  int limit,
                                  CursorType cursorType,
                                  long total) {
        int pageLimit = limit > 0 ? limit : 20;
        Cursor parsed = parseCursor(cursor);
        List<FollowEdge> page = new ArrayList<>();

        if (edges != null) {
            lock.readLock().lock();
            try {
                for (FollowEdge edge : edges) {
                    if (parsed != null && !isAfterCursor(edge, parsed, cursorType)) {
                        continue;
                    }
                    page.add(edge);
                    if (page.size() >= pageLimit) {
                        break;
                    }
                }
            } finally {
                lock.readLock().unlock();
            }
        }

        String nextCursor = null;
        if (page.size() == pageLimit) {
            FollowEdge last = page.get(page.size() - 1);
            nextCursor = encodeCursor(last, cursorType);
        }

        return new FollowPage(page, nextCursor, total);
    }

    private NavigableSet<FollowEdge> newSet(UUID ignored) {
        return new ConcurrentSkipListSet<>(EDGE_COMPARATOR);
    }

    private void decrementCount(Map<UUID, Long> counts, UUID key) {
        counts.computeIfPresent(key, (id, value) -> {
            long next = value - 1;
            return next > 0 ? next : null;
        });
    }

    private String key(UUID followerId, UUID followeeId) {
        return followerId + ":" + followeeId;
    }

    private Cursor parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        String[] parts = cursor.split("\\|", 2);
        if (parts.length != 2) {
            return null;
        }
        try {
            Instant instant = Instant.parse(parts[0]);
            return new Cursor(instant, parts[1]);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private boolean isAfterCursor(FollowEdge edge, Cursor cursor, CursorType type) {
        int timeCompare = edge.createdAt().compareTo(cursor.createdAt());
        if (timeCompare < 0) {
            return true;
        }
        if (timeCompare > 0) {
            return false;
        }
        String tieKey = tieKey(edge, type);
        return tieKey.compareTo(cursor.tieKey()) > 0;
    }

    private String encodeCursor(FollowEdge edge, CursorType type) {
        return edge.createdAt().toString() + "|" + tieKey(edge, type);
    }

    private String tieKey(FollowEdge edge, CursorType type) {
        return type == CursorType.FOLLOWER
                ? edge.followerId().toString()
                : edge.followeeId().toString();
    }

    private enum CursorType {
        FOLLOWER,
        FOLLOWEE
    }

    private record Cursor(Instant createdAt, String tieKey) {
    }
}
