"use client";

import style from "./post.module.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import type { PostResponse, ProfileResponse } from "@/lib/types";
import CommentComposer from "@/app/(afterLogin)/_component/CommentComposer";
import { buildProfileHref } from "@/lib/followRoutes";
import PostEngagement from "@/app/(afterLogin)/_component/PostEngagement";

dayjs.extend(relativeTime);

type Props = {
  post: PostResponse;
  author?: ProfileResponse;
  className?: string;
};

export default function PostCard({ post, author, className }: Props) {
  const displayName = author?.nickname?.trim() || "New user";
  const username = author?.username?.trim() || post.authorId.slice(0, 8);
  const avatarUrl = author?.avatarUrl?.trim();
  const avatarLabel = (displayName || username).slice(0, 2).toUpperCase();
  const profileHref = buildProfileHref({ userId: post.authorId, username: author?.username ?? null });
  const cardClassName = className ? `${style.postCard} ${className}` : style.postCard;

  return (
    <article className={cardClassName}>
      <div className={style.postHeader}>
        <Link className={style.avatarLink} href={profileHref}>
          {avatarUrl ? (
            <img className={style.avatarImage} src={avatarUrl} alt={displayName} />
          ) : (
            <div className={style.avatarFallback}>{avatarLabel}</div>
          )}
        </Link>
        <div className={style.postMeta}>
          <div className={style.postUserRow}>
            <Link href={profileHref} className={style.postUserName}>
              {displayName}
            </Link>
            <span className={style.postUserNick}>@{username}</span>
          </div>
          <div className={style.postSubRow}>
            <span className={style.postVisibility}>{post.visibility}</span>
            <span className={style.postDate}>{dayjs(post.createdAt).fromNow()}</span>
          </div>
        </div>
      </div>
      <Link className={style.postContentLink} href={`/post/${post.id}`}>
        <p className={style.postContent}>{post.content}</p>
      </Link>
      <div className={style.postFooter}>
        <PostEngagement
          postId={post.id}
          likeCount={post.likeCount}
          likedByMe={post.likedByMe}
          commentCount={post.commentCount}
        />
      </div>
      <div className={style.postReply}>
        <CommentComposer postId={post.id} />
      </div>
    </article>
  );
}
