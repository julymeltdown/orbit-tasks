package com.example.post.domain;

import java.util.List;
import java.util.UUID;

public record FeedCachePage(List<UUID> postIds, String nextCursor) {
}
