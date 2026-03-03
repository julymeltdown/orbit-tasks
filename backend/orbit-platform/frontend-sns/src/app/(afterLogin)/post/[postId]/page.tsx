"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import pageStyles from "@/app/(afterLogin)/page.module.css";
import styles from "@/app/(afterLogin)/post/postDetail.module.css";
import { useGetPostQuery } from "@/store/redux/apiSlice";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import CommentComposer from "@/app/(afterLogin)/_component/CommentComposer";
import { buildProfileHref } from "@/lib/followRoutes";
import PostEngagement from "@/app/(afterLogin)/_component/PostEngagement";

 dayjs.extend(relativeTime);

export default function PostDetailPage() {
  const params = useParams();
  const postId = typeof params.postId === "string" ? params.postId : "";
  const { data, isLoading, error } = useGetPostQuery(postId, {
    skip: !postId,
  });

  const authorIds = useMemo(() => {
    if (!data) {
      return [] as string[];
    }
    const ids = data.comments.map((comment) => comment.authorId);
    ids.push(data.post.authorId);
    return ids;
  }, [data]);

  const { profiles } = useProfilesMap(authorIds);
  const postAuthor = data ? profiles.get(data.post.authorId) : undefined;
  const profileHref = (userId: string) => {
    const profile = profiles.get(userId);
    return buildProfileHref({ userId, username: profile?.username ?? null });
  };

  return (
    <div className={`${pageStyles.page} ${styles.threadPage}`}>
      <div className={styles.threadHeader}>
        <Link className={styles.backLink} href="/home">
          ← Back to feed
        </Link>
      </div>
      {isLoading && <div>Loading post...</div>}
      {error && <div className={pageStyles.error}>Unable to load post.</div>}
      {data && (
        <div className={styles.threadCard}>
          <div className={styles.threadMeta}>
            <Link className={`${styles.avatar} ${styles.profileLink}`} href={profileHref(data.post.authorId)}>
              {postAuthor?.avatarUrl ? (
                <img src={postAuthor.avatarUrl} alt={postAuthor.nickname ?? "avatar"} />
              ) : (
                (postAuthor?.nickname ?? "??").slice(0, 2).toUpperCase()
              )}
            </Link>
            <div className={styles.threadUser}>
              <Link
                className={`${styles.threadName} ${styles.profileLink}`}
                href={profileHref(data.post.authorId)}
              >
                {postAuthor?.nickname ?? "New user"}
              </Link>
              <Link
                className={`${styles.threadHandle} ${styles.profileLink}`}
                href={profileHref(data.post.authorId)}
              >
                @{postAuthor?.username ?? data.post.authorId.slice(0, 8)}
              </Link>
              <div className={styles.threadTime}>{dayjs(data.post.createdAt).fromNow()}</div>
            </div>
          </div>
          <div className={styles.threadContent}>{data.post.content}</div>
          <PostEngagement
            postId={data.post.id}
            likeCount={data.post.likeCount}
            likedByMe={data.post.likedByMe}
            commentCount={data.post.commentCount}
            className={styles.threadEngagement}
          />
          <div className={styles.commentSection}>
            <CommentComposer postId={data.post.id} />
            <div className={styles.commentList}>
              {data.comments.map((comment) => {
                const author = profiles.get(comment.authorId);
                return (
                  <div className={styles.commentItem} key={comment.id}>
                    <Link className={`${styles.avatar} ${styles.profileLink}`} href={profileHref(comment.authorId)}>
                      {author?.avatarUrl ? (
                        <img src={author.avatarUrl} alt={author.nickname ?? "avatar"} />
                      ) : (
                        (author?.nickname ?? "??").slice(0, 2).toUpperCase()
                      )}
                    </Link>
                    <div className={styles.commentMeta}>
                      <Link
                        className={`${styles.commentName} ${styles.profileLink}`}
                        href={profileHref(comment.authorId)}
                      >
                        {author?.nickname ?? "New user"}
                      </Link>
                      <Link
                        className={`${styles.commentHandle} ${styles.profileLink}`}
                        href={profileHref(comment.authorId)}
                      >
                        @{author?.username ?? comment.authorId.slice(0, 8)}
                      </Link>
                      <div className={styles.commentContent}>{comment.content}</div>
                    </div>
                  </div>
                );
              })}
              {data.comments.length === 0 && (
                <div className={pageStyles.muted}>Be the first to reply.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
