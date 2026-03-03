"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import pageStyles from "@/app/(afterLogin)/page.module.css";
import styles from "./profile.module.css";
import { profileApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { ProfileResponse, PostResponse } from "@/lib/types";
import { alertForError, resolveErrorMessage } from "@/lib/errorMapper";
import Post from "@/app/(afterLogin)/_component/Post";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import {
  useGetFollowCountsQuery,
  useGetFollowStatusQuery,
  useLazyGetAuthorPostsQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
} from "@/store/redux/apiSlice";
import { buildFollowListHref } from "@/lib/followRoutes";

type ProfileTab = "posts" | "about";

export default function ProfilePage() {
  return (
    <Suspense fallback={<section className={styles.loading}>Loading profile...</section>}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selfId = useAuthStore((state) => state.userId);
  const [targetId, setTargetId] = useState(selfId ?? "");
  const [targetUsername, setTargetUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [requestedPostsCursor, setRequestedPostsCursor] = useState<string | null>(null);
  const [triggerPosts, postsResult] = useLazyGetAuthorPostsQuery();
  const [followUser, followResult] = useFollowUserMutation();
  const [unfollowUser, unfollowResult] = useUnfollowUserMutation();

  useEffect(() => {
    const queryUsername = searchParams.get("username");
    const queryId = searchParams.get("userId");
    const queryTab = searchParams.get("tab");
    if (queryUsername) {
      setTargetUsername(queryUsername);
      setTargetId("");
    } else if (queryId) {
      setTargetUsername(null);
      setTargetId(queryId);
    } else if (selfId) {
      setTargetUsername(null);
      setTargetId(selfId);
    }
    if (queryTab === "posts" || queryTab === "about") {
      setActiveTab(queryTab);
    }
  }, [searchParams, selfId]);

  const { data, error, isLoading } = useQuery<ProfileResponse>({
    queryKey: ["profile", targetUsername ?? targetId],
    queryFn: () =>
      targetUsername ? profileApi.getByUsername(targetUsername) : profileApi.get(targetId),
    enabled: Boolean(targetUsername || targetId),
  });

  useEffect(() => {
    if (error) {
      alertForError(error);
    }
  }, [error]);

  const targetUserId = data?.userId ?? targetId;
  const isSelf = Boolean(selfId && targetUserId && selfId === targetUserId);
  const displayName = data?.nickname?.trim() || "New user";
  const username = data?.username?.trim() || targetUsername || "pending";
  const avatarUrl = data?.avatarUrl?.trim() || "";
  const bio = data?.bio?.trim() || "Share a short profile message with your followers.";
  const avatarLabel = useMemo(
    () => (displayName || username).slice(0, 2).toUpperCase(),
    [displayName, username]
  );

  const { data: followCounts } = useGetFollowCountsQuery(
    { userId: targetUserId },
    { skip: !targetUserId }
  );
  const { data: followStatus } = useGetFollowStatusQuery(
    { targetUserId: targetUserId ?? "" },
    { skip: !targetUserId || isSelf }
  );

  const isFollowing = followStatus?.following ?? false;

  useEffect(() => {
    if (!targetUserId) {
      return;
    }
    setPosts([]);
    setPostsCursor(null);
    setRequestedPostsCursor(null);
    triggerPosts({ authorId: targetUserId, cursor: null, limit: 10 });
  }, [targetUserId, triggerPosts]);

  useEffect(() => {
    const data = postsResult.data;
    if (!data) {
      return;
    }
    setPosts((prev) => (requestedPostsCursor ? [...prev, ...data.posts] : data.posts));
    setPostsCursor(data.nextCursor || null);
  }, [postsResult.data, requestedPostsCursor]);

  const loadMorePosts = useCallback(() => {
    if (!targetUserId || !postsCursor || postsResult.isFetching) {
      return;
    }
    setRequestedPostsCursor(postsCursor);
    triggerPosts({ authorId: targetUserId, cursor: postsCursor, limit: 10 });
  }, [targetUserId, postsCursor, postsResult.isFetching, triggerPosts]);

  const postsSentinel = useInfiniteScroll({
    hasMore: Boolean(postsCursor),
    loading: postsResult.isFetching,
    onLoadMore: loadMorePosts,
  });

  const handleFollow = async (userId: string) => {
    try {
      await followUser({ targetUserId: userId }).unwrap();
    } catch (err) {
      alertForError(err);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser({ targetUserId: userId }).unwrap();
    } catch (err) {
      alertForError(err);
    }
  };

  const toggleFollow = async () => {
    if (!targetUserId || isSelf) {
      return;
    }
    if (isFollowing) {
      await handleUnfollow(targetUserId);
    } else {
      await handleFollow(targetUserId);
    }
  };

  const errorMessage = error ? resolveErrorMessage(error) : null;
  const followerCount = followCounts?.followerCount ?? data?.followerCount ?? 0;
  const followingCount = followCounts?.followingCount ?? data?.followingCount ?? 0;
  const postCount = Math.max(data?.postCount ?? 0, posts.length);
  const isFollowBusy = followResult.isLoading || unfollowResult.isLoading;

  const handleTabClick = useCallback(
    (tab: ProfileTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`/profile?${params.toString()}`);
      setActiveTab(tab);
    },
    [router, searchParams]
  );

  const handleFollowListClick = useCallback(
    (tab: "followers" | "following") => {
      if (!targetUserId) {
        return;
      }
      router.push(
        buildFollowListHref({
          userId: targetUserId,
          username: data?.username ?? targetUsername,
          tab,
        })
      );
    },
    [router, targetUserId, data?.username, targetUsername]
  );

  return (
    <section className={`${pageStyles.page} ${styles.profilePage}`}>
      <div className={styles.cover} />
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          {avatarUrl ? (
            <img className={styles.avatarImage} src={avatarUrl} alt={displayName} />
          ) : (
            <div className={styles.avatarFallback}>{avatarLabel}</div>
          )}
        </div>
        <div className={styles.headerBody}>
          <div className={styles.nameRow}>
            <div>
              <div className={styles.displayName}>{displayName}</div>
              <div className={styles.username}>@{username}</div>
            </div>
            <div className={styles.actions}>
              {isSelf ? (
                <Link className={styles.secondaryButton} href="/profile/edit">
                  Edit profile
                </Link>
              ) : (
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={toggleFollow}
                  disabled={isFollowBusy || !targetUserId}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
          <p className={styles.bio}>{bio}</p>
          <div className={styles.stats}>
            <button
              className={`${styles.stat} ${styles.statButton}`}
              type="button"
              onClick={() => handleFollowListClick("followers")}
            >
              <span className={styles.statValue}>{followerCount}</span>
              <span className={styles.statLabel}>Followers</span>
            </button>
            <button
              className={`${styles.stat} ${styles.statButton}`}
              type="button"
              onClick={() => handleFollowListClick("following")}
            >
              <span className={styles.statValue}>{followingCount}</span>
              <span className={styles.statLabel}>Following</span>
            </button>
            <button
              className={`${styles.stat} ${styles.statButton}`}
              type="button"
              onClick={() => handleTabClick("posts")}
            >
              <span className={styles.statValue}>{postCount}</span>
              <span className={styles.statLabel}>Posts</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && <div className={styles.loading}>Loading profile...</div>}
      {errorMessage && <div className={pageStyles.error}>{errorMessage}</div>}

      {!isLoading && !error && (
        <>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tabButton} ${activeTab === "posts" ? styles.tabButtonActive : ""}`}
              type="button"
              onClick={() => handleTabClick("posts")}
            >
              Posts
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "about" ? styles.tabButtonActive : ""}`}
              type="button"
              onClick={() => handleTabClick("about")}
            >
              About
            </button>
          </div>
          {activeTab === "posts" && (
            <div className={styles.postsSection}>
              {postsResult.isFetching && posts.length === 0 && (
                <div className={styles.loading}>Loading posts...</div>
              )}
              {postsResult.error && (
                <div className={pageStyles.error}>Unable to load posts.</div>
              )}
              {posts.map((post) => (
                <Post key={post.id} post={post} author={data} />
              ))}
              <div ref={postsSentinel} />
              {!postsResult.isFetching && posts.length === 0 && !postsResult.error && (
                <div className={styles.emptyState}>No posts yet.</div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className={styles.cards}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Profile details</div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Display name</span>
                  <span className={styles.cardValue}>{displayName}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Username</span>
                  <span className={styles.cardValue}>@{username}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Profile message</span>
                  <span className={styles.cardValue}>{bio}</span>
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Quick actions</div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Followers</span>
                  <button
                    className={styles.textButton}
                    type="button"
                    onClick={() => handleFollowListClick("followers")}
                  >
                    View followers
                  </button>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Following</span>
                  <button
                    className={styles.textButton}
                    type="button"
                    onClick={() => handleFollowListClick("following")}
                  >
                    View following
                  </button>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Notifications</span>
                  <Link className={styles.textLink} href="/notifications">
                    View alerts
                  </Link>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Home</span>
                  <Link className={styles.textLink} href="/home">
                    See latest posts
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
