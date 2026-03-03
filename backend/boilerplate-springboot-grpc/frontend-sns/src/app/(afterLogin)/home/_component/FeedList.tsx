"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLazyGetFeedQuery } from "@/store/redux/apiSlice";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import PostCard from "@/app/(afterLogin)/_component/Post";
import type { PostResponse } from "@/lib/types";
import styles from "./feedList.module.css";

const PAGE_SIZE = 10;

export default function FeedList() {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [requestedCursor, setRequestedCursor] = useState<string | null>(null);
  const [newBatchIndex, setNewBatchIndex] = useState<number | null>(null);
  const [lastBatchCount, setLastBatchCount] = useState(0);
  const [showBatchNotice, setShowBatchNotice] = useState(false);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const [trigger, { data, isFetching, error }] = useLazyGetFeedQuery();
  const appendIndexRef = useRef<number | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRequestedCursor(null);
    setNewBatchIndex(null);
    setShowBatchNotice(false);
    setHighlightIds(new Set());
    trigger({ cursor: null, limit: PAGE_SIZE });
  }, [trigger]);

  useEffect(() => {
    if (!data) {
      return;
    }
    setPosts((prev) => (requestedCursor ? [...prev, ...data.posts] : data.posts));
    setCursor(data.nextCursor || null);
    if (requestedCursor) {
      const startIndex = appendIndexRef.current ?? 0;
      setNewBatchIndex(startIndex);
      setLastBatchCount(data.posts.length);
      setShowBatchNotice(true);
      setHighlightIds(new Set(data.posts.map((post) => post.id)));
      appendIndexRef.current = null;
    } else {
      setNewBatchIndex(null);
      setHighlightIds(new Set());
    }
  }, [data, requestedCursor]);

  const loadMore = useCallback(() => {
    if (!cursor || isFetching) {
      return;
    }
    appendIndexRef.current = posts.length;
    setRequestedCursor(cursor);
    trigger({ cursor, limit: PAGE_SIZE });
  }, [cursor, isFetching, posts.length, trigger]);

  useEffect(() => {
    if (!showBatchNotice) {
      return;
    }
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => {
      setShowBatchNotice(false);
    }, 2000);
  }, [showBatchNotice]);

  useEffect(() => {
    if (highlightIds.size === 0) {
      return;
    }
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightIds(new Set());
    }, 2600);
  }, [highlightIds]);

  const sentinelRef = useInfiniteScroll({
    hasMore: Boolean(cursor),
    loading: isFetching,
    onLoadMore: loadMore,
  });

  const authorIds = useMemo(() => posts.map((post) => post.authorId), [posts]);
  const { profiles } = useProfilesMap(authorIds);

  return (
    <div className={styles.feed}>
      {posts.map((post, index) => {
        const showMarker = showBatchNotice && newBatchIndex !== null && index === newBatchIndex;
        const highlight = highlightIds.has(post.id);
        return (
          <Fragment key={post.id}>
            {showMarker && (
              <div className={styles.newBatch}>
                Loaded {lastBatchCount} new posts
              </div>
            )}
            <PostCard
              post={post}
              author={profiles.get(post.authorId)}
              className={highlight ? styles.postHighlight : undefined}
            />
          </Fragment>
        );
      })}
      {error && <div className={styles.error}>Unable to load posts.</div>}
      {isFetching && (
        <div className={styles.loadingRow}>
          <span className={styles.spinner} aria-hidden="true" />
          <span>{posts.length ? "Loading more posts..." : "Loading posts..."}</span>
        </div>
      )}
      <div ref={sentinelRef} className={styles.sentinel} />
      {!isFetching && posts.length === 0 && !error && (
        <div className={styles.empty}>No posts yet.</div>
      )}
    </div>
  );
}
