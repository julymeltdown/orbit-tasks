"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import pageStyles from "@/app/(afterLogin)/page.module.css";
import styles from "./follows.module.css";
import { profileApi } from "@/lib/api";
import { alertForError, resolveErrorMessage } from "@/lib/errorMapper";
import { useAuthStore } from "@/store/authStore";
import type { FollowEdgeResponse, ProfileResponse } from "@/lib/types";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import {
  useGetFollowCountsQuery,
  useLazyGetFollowersQuery,
  useLazyGetFollowingQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
} from "@/store/redux/apiSlice";
import { buildFollowListHref, buildProfileHref, normalizeFollowTab, type FollowTab } from "@/lib/followRoutes";

export default function FollowListPage() {
  return (
    <Suspense fallback={<section className={styles.loading}>Loading follow list...</section>}>
      <FollowListContent />
    </Suspense>
  );
}

function FollowListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selfId = useAuthStore((state) => state.userId);
  const [targetId, setTargetId] = useState(selfId ?? "");
  const [targetUsername, setTargetUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FollowTab>("followers");
  const [followers, setFollowers] = useState<FollowEdgeResponse[]>([]);
  const [followersCursor, setFollowersCursor] = useState<string | null>(null);
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [requestedFollowersCursor, setRequestedFollowersCursor] = useState<string | null>(null);
  const [following, setFollowing] = useState<FollowEdgeResponse[]>([]);
  const [followingCursor, setFollowingCursor] = useState<string | null>(null);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [requestedFollowingCursor, setRequestedFollowingCursor] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const [triggerFollowers, followersResult] = useLazyGetFollowersQuery();
  const [triggerFollowing, followingResult] = useLazyGetFollowingQuery();
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

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
    setActiveTab(normalizeFollowTab(queryTab));
  }, [searchParams, selfId]);

  const { data, error, isLoading } = useQuery<ProfileResponse>({
    queryKey: ["follow-profile", targetUsername ?? targetId],
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
  const avatarLabel = useMemo(
    () => (displayName || username).slice(0, 2).toUpperCase(),
    [displayName, username]
  );

  const { data: followCounts } = useGetFollowCountsQuery(
    { userId: targetUserId },
    { skip: !targetUserId }
  );

  const followerCount = followCounts?.followerCount ?? data?.followerCount ?? 0;
  const followingCount = followCounts?.followingCount ?? data?.followingCount ?? 0;

  useEffect(() => {
    if (!targetUserId) {
      return;
    }
    setFollowers([]);
    setFollowersCursor(null);
    setRequestedFollowersCursor(null);
    setFollowersLoaded(false);
    setFollowing([]);
    setFollowingCursor(null);
    setRequestedFollowingCursor(null);
    setFollowingLoaded(false);
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) {
      return;
    }
    if (activeTab === "followers" && !followersLoaded && !followersResult.isFetching) {
      triggerFollowers({ userId: targetUserId, cursor: null, limit: 30 });
    }
    if (activeTab === "following" && !followingLoaded && !followingResult.isFetching) {
      triggerFollowing({ userId: targetUserId, cursor: null, limit: 30 });
    }
  }, [
    activeTab,
    followersLoaded,
    followersResult.isFetching,
    followingLoaded,
    followingResult.isFetching,
    targetUserId,
    triggerFollowers,
    triggerFollowing,
  ]);

  useEffect(() => {
    const data = followersResult.data;
    if (!data) {
      return;
    }
    setFollowers((prev) => (requestedFollowersCursor ? [...prev, ...data.edges] : data.edges));
    setFollowersCursor(data.nextCursor || null);
    setFollowersLoaded(true);
  }, [followersResult.data, requestedFollowersCursor]);

  useEffect(() => {
    const data = followingResult.data;
    if (!data) {
      return;
    }
    setFollowing((prev) => (requestedFollowingCursor ? [...prev, ...data.edges] : data.edges));
    setFollowingCursor(data.nextCursor || null);
    setFollowingLoaded(true);
  }, [followingResult.data, requestedFollowingCursor]);

  useEffect(() => {
    if (followersResult.error) {
      setFollowersLoaded(true);
    }
  }, [followersResult.error]);

  useEffect(() => {
    if (followingResult.error) {
      setFollowingLoaded(true);
    }
  }, [followingResult.error]);

  const loadMoreFollowers = useCallback(() => {
    if (!targetUserId || !followersCursor || followersResult.isFetching) {
      return;
    }
    setRequestedFollowersCursor(followersCursor);
    triggerFollowers({ userId: targetUserId, cursor: followersCursor, limit: 30 });
  }, [targetUserId, followersCursor, followersResult.isFetching, triggerFollowers]);

  const loadMoreFollowing = useCallback(() => {
    if (!targetUserId || !followingCursor || followingResult.isFetching) {
      return;
    }
    setRequestedFollowingCursor(followingCursor);
    triggerFollowing({ userId: targetUserId, cursor: followingCursor, limit: 30 });
  }, [targetUserId, followingCursor, followingResult.isFetching, triggerFollowing]);

  const followersSentinel = useInfiniteScroll({
    hasMore: Boolean(followersCursor),
    loading: followersResult.isFetching,
    onLoadMore: loadMoreFollowers,
  });

  const followingSentinel = useInfiniteScroll({
    hasMore: Boolean(followingCursor),
    loading: followingResult.isFetching,
    onLoadMore: loadMoreFollowing,
  });

  const handleFollow = async (userId: string) => {
    setActionUserId(userId);
    try {
      await followUser({ targetUserId: userId }).unwrap();
    } catch (err) {
      alertForError(err);
    } finally {
      setActionUserId(null);
    }
  };

  const handleUnfollow = async (userId: string) => {
    setActionUserId(userId);
    try {
      await unfollowUser({ targetUserId: userId }).unwrap();
    } catch (err) {
      alertForError(err);
    } finally {
      setActionUserId(null);
    }
  };

  const handleTabClick = useCallback(
    (tab: FollowTab) => {
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
      setActiveTab(tab);
    },
    [router, targetUserId, data?.username, targetUsername]
  );

  const listIds = useMemo(() => {
    return activeTab === "followers"
      ? followers.map((entry) => entry.userId)
      : following.map((entry) => entry.userId);
  }, [activeTab, followers, following]);
  const { profiles } = useProfilesMap(listIds);

  const errorMessage = error ? resolveErrorMessage(error) : null;
  const profileHref = targetUserId
    ? buildProfileHref({ userId: targetUserId, username: data?.username ?? targetUsername })
    : "/profile";

  return (
    <section className={`${pageStyles.page} ${styles.followPage}`}>
      <div className={styles.header}>
        <Link className={styles.backLink} href={profileHref}>
          ← Back to profile
        </Link>
        <div className={styles.profileRow}>
          <div className={styles.avatar}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} />
            ) : (
              <div className={styles.avatarFallback}>{avatarLabel}</div>
            )}
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{displayName}</div>
            <div className={styles.profileHandle}>@{username}</div>
          </div>
        </div>
      </div>

      {isLoading && <div className={styles.loading}>Loading follow list...</div>}
      {errorMessage && <div className={pageStyles.error}>{errorMessage}</div>}

      {!isLoading && !error && (
        <>
          <div className={styles.tabs}>
            <button
              className={`${styles.tabButton} ${activeTab === "followers" ? styles.tabActive : ""}`}
              type="button"
              onClick={() => handleTabClick("followers")}
            >
              Followers · {followerCount}
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "following" ? styles.tabActive : ""}`}
              type="button"
              onClick={() => handleTabClick("following")}
            >
              Following · {followingCount}
            </button>
          </div>

          <div className={styles.list}>
            {activeTab === "followers" && followersResult.isFetching && followers.length === 0 && (
              <div className={styles.loading}>Loading followers...</div>
            )}
            {activeTab === "following" && followingResult.isFetching && following.length === 0 && (
              <div className={styles.loading}>Loading following...</div>
            )}
            {(activeTab === "followers" ? followers : following).map((entry) => {
              const profile = profiles.get(entry.userId);
              const name = profile?.nickname?.trim() || "New user";
              const handle = profile?.username?.trim() || entry.userId.slice(0, 8);
              const avatar = profile?.avatarUrl?.trim();
              const avatarLabel = (name || handle).slice(0, 2).toUpperCase();
              const href = buildProfileHref({ userId: entry.userId, username: profile?.username ?? null });
              const isBusy = actionUserId === entry.userId;
              return (
                <div key={`${activeTab}-${entry.userId}`} className={styles.row}>
                  <Link className={styles.avatarMini} href={href}>
                    {avatar ? (
                      <img src={avatar} alt={name} />
                    ) : (
                      <div className={styles.avatarFallbackMini}>{avatarLabel}</div>
                    )}
                  </Link>
                  <div className={styles.rowInfo}>
                    <Link className={styles.rowName} href={href}>
                      {name}
                    </Link>
                    <span className={styles.rowHandle}>@{handle}</span>
                  </div>
                  {isSelf && activeTab === "following" && (
                    <button
                      className={styles.rowAction}
                      type="button"
                      onClick={() => handleUnfollow(entry.userId)}
                      disabled={isBusy}
                    >
                      {isBusy ? "..." : "Unfollow"}
                    </button>
                  )}
                  {isSelf && activeTab === "followers" && (
                    <button
                      className={styles.rowAction}
                      type="button"
                      onClick={() => handleFollow(entry.userId)}
                      disabled={isBusy}
                    >
                      {isBusy ? "..." : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}
            {activeTab === "followers" && <div ref={followersSentinel} />}
            {activeTab === "following" && <div ref={followingSentinel} />}
            {activeTab === "followers" && !followersResult.isFetching && followers.length === 0 && (
              <div className={styles.empty}>No followers yet.</div>
            )}
            {activeTab === "following" && !followingResult.isFetching && following.length === 0 && (
              <div className={styles.empty}>No following yet.</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
