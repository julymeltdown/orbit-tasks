"use client";

import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "@/app/(afterLogin)/page.module.css";
import { notificationApi } from "@/lib/api";
import type { NotificationFeedResponse } from "@/lib/types";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, fetchNextPage, hasNextPage, isFetching, error } = useInfiniteQuery<
    NotificationFeedResponse,
    Error,
    InfiniteData<NotificationFeedResponse>,
    [string],
    string | null
  >({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) => notificationApi.list(pageParam ?? null, 10),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApi.markRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const isMutating = markReadMutation.isPending || markAllReadMutation.isPending;

  return (
    <div className={styles.page}>
      <div className={styles.heading}>Notifications</div>
      {error && <div className={styles.error}>Unable to load notifications.</div>}
      <div style={{ marginBottom: 12 }}>
        <button
          className={styles.buttonSecondary}
          onClick={() => markAllReadMutation.mutate()}
          disabled={isMutating}
        >
          {markAllReadMutation.isPending ? "Marking..." : "Mark all as read"}
        </button>
      </div>
      <section className={styles.section}>
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <strong>{item.type}</strong> · {item.createdAt}
              {item.readAt ? (
                <span style={{ marginLeft: 8, color: "#5b6b7a", fontSize: 12 }}>Read</span>
              ) : (
                <button
                  className={styles.buttonSecondary}
                  style={{ marginLeft: 8, padding: "2px 8px", fontSize: 12 }}
                  onClick={() => markReadMutation.mutate(item.id)}
                  disabled={isMutating}
                >
                  Mark read
                </button>
              )}
              <div>{item.payloadJson}</div>
            </div>
          ))}
          {!items.length && !error && (
            <div>No notifications yet.</div>
          )}
        </div>
        {hasNextPage && (
          <button className={styles.buttonSecondary} onClick={() => fetchNextPage()} disabled={isFetching}>
            {isFetching ? "Loading..." : "Load more"}
          </button>
        )}
      </section>
    </div>
  );
}
