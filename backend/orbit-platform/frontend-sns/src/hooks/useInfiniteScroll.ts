"use client";

import { useEffect, useRef } from "react";

type Options = {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
};

export function useInfiniteScroll({ hasMore, loading, onLoadMore, rootMargin = "200px" }: Options) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const wasIntersectingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingRef.current = loading;
    if (!loading) {
      inFlightRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const target = ref.current;
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isIntersecting = Boolean(entry?.isIntersecting);
        if (isIntersecting && !wasIntersectingRef.current) {
          if (hasMoreRef.current && !loadingRef.current && !inFlightRef.current) {
            inFlightRef.current = true;
            onLoadMoreRef.current();
          }
        }
        wasIntersectingRef.current = isIntersecting;
      },
      { rootMargin }
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  return ref;
}
