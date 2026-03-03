"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./postEngagement.module.css";
import { useLikePostMutation, useUnlikePostMutation } from "@/store/redux/apiSlice";

const heartPath =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

type Props = {
  postId: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  className?: string;
};

export default function PostEngagement({
  postId,
  likeCount,
  likedByMe,
  commentCount,
  className,
}: Props) {
  const [localCount, setLocalCount] = useState(likeCount);
  const [localLiked, setLocalLiked] = useState(likedByMe);
  const [likePost, likeResult] = useLikePostMutation();
  const [unlikePost, unlikeResult] = useUnlikePostMutation();

  useEffect(() => {
    setLocalCount(likeCount);
    setLocalLiked(likedByMe);
  }, [likeCount, likedByMe]);

  const isBusy = likeResult.isLoading || unlikeResult.isLoading;
  const likeLabel = localLiked ? "Liked" : "Like";
  const likeCountLabel = useMemo(() => {
    if (localCount === 1) {
      return "1 like";
    }
    return `${localCount} likes`;
  }, [localCount]);

  const handleLike = async () => {
    if (isBusy) {
      return;
    }
    try {
      const result = localLiked
        ? await unlikePost({ postId }).unwrap()
        : await likePost({ postId }).unwrap();
      setLocalCount(result.likeCount);
      setLocalLiked(result.liked);
    } catch {
      alert("Unable to update likes right now.");
    }
  };

  return (
    <div className={className ? `${styles.engagementRow} ${className}` : styles.engagementRow}>
      <button
        type="button"
        className={localLiked ? `${styles.likeButton} ${styles.likeButtonActive}` : styles.likeButton}
        onClick={handleLike}
        disabled={isBusy}
        aria-pressed={localLiked}
      >
        <span className={styles.likeIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" role="presentation">
            <path d={heartPath} />
          </svg>
        </span>
        <span className={styles.likeText}>{likeLabel}</span>
        <span className={styles.likeCount}>{likeCountLabel}</span>
      </button>
      <span className={styles.replyCount}>
        {commentCount} {commentCount === 1 ? "reply" : "replies"}
      </span>
    </div>
  );
}
