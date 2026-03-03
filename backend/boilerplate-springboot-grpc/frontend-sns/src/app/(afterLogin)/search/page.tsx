"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import pageStyles from "@/app/(afterLogin)/page.module.css";
import styles from "@/app/(afterLogin)/search/search.module.css";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import {
  useLazySearchPostsQuery,
  useLazySearchProfilesQuery,
  useLazyGetTrendingPostsQuery,
} from "@/store/redux/apiSlice";
import PostCard from "@/app/(afterLogin)/_component/Post";
import type { PostResponse, ProfileResponse } from "@/lib/types";

const PAGE_SIZE = 10;

type TabKey = "posts" | "people";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<TabKey>("posts");

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [requestedPostsCursor, setRequestedPostsCursor] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileResponse[]>([]);
  const [profilesCursor, setProfilesCursor] = useState<string | null>(null);
  const [requestedProfilesCursor, setRequestedProfilesCursor] = useState<string | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<PostResponse[]>([]);
  const [trendingCursor, setTrendingCursor] = useState<string | null>(null);
  const [requestedTrendingCursor, setRequestedTrendingCursor] = useState<string | null>(null);

  const [triggerPosts, postsResult] = useLazySearchPostsQuery();
  const [triggerProfiles, profilesResult] = useLazySearchProfilesQuery();
  const [triggerTrending, trendingResult] = useLazyGetTrendingPostsQuery();

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      setPostsCursor(null);
      setProfiles([]);
      setProfilesCursor(null);
      setTrendingPosts([]);
      setTrendingCursor(null);
      return;
    }
    setRequestedPostsCursor(null);
    setRequestedProfilesCursor(null);
    triggerPosts({ query, cursor: null, limit: PAGE_SIZE });
    triggerProfiles({ query, cursor: null, limit: PAGE_SIZE });
  }, [query, triggerPosts, triggerProfiles]);

  useEffect(() => {
    if (query.trim()) {
      return;
    }
    setRequestedTrendingCursor(null);
    triggerTrending({ cursor: null, limit: PAGE_SIZE });
  }, [query, triggerTrending]);

  useEffect(() => {
    const data = postsResult.data;
    if (!data) {
      return;
    }
    setPosts((prev) => (requestedPostsCursor ? [...prev, ...data.posts] : data.posts));
    setPostsCursor(data.nextCursor || null);
  }, [postsResult.data, requestedPostsCursor]);

  useEffect(() => {
    const data = profilesResult.data;
    if (!data) {
      return;
    }
    setProfiles((prev) =>
      requestedProfilesCursor ? [...prev, ...data.profiles] : data.profiles
    );
    setProfilesCursor(data.nextCursor || null);
  }, [profilesResult.data, requestedProfilesCursor]);

  useEffect(() => {
    const data = trendingResult.data;
    if (!data) {
      return;
    }
    setTrendingPosts((prev) =>
      requestedTrendingCursor ? [...prev, ...data.posts] : data.posts
    );
    setTrendingCursor(data.nextCursor || null);
  }, [trendingResult.data, requestedTrendingCursor]);

  const loadMorePosts = useCallback(() => {
    if (!postsCursor || postsResult.isFetching) {
      return;
    }
    setRequestedPostsCursor(postsCursor);
    triggerPosts({ query, cursor: postsCursor, limit: PAGE_SIZE });
  }, [postsCursor, postsResult.isFetching, triggerPosts, query]);

  const loadMoreProfiles = useCallback(() => {
    if (!profilesCursor || profilesResult.isFetching) {
      return;
    }
    setRequestedProfilesCursor(profilesCursor);
    triggerProfiles({ query, cursor: profilesCursor, limit: PAGE_SIZE });
  }, [profilesCursor, profilesResult.isFetching, triggerProfiles, query]);

  const loadMoreTrending = useCallback(() => {
    if (!trendingCursor || trendingResult.isFetching) {
      return;
    }
    setRequestedTrendingCursor(trendingCursor);
    triggerTrending({ cursor: trendingCursor, limit: PAGE_SIZE });
  }, [trendingCursor, trendingResult.isFetching, triggerTrending]);

  const postsSentinel = useInfiniteScroll({
    hasMore: Boolean(postsCursor),
    loading: postsResult.isFetching,
    onLoadMore: loadMorePosts,
  });

  const trendingSentinel = useInfiniteScroll({
    hasMore: Boolean(trendingCursor),
    loading: trendingResult.isFetching,
    onLoadMore: loadMoreTrending,
  });

  const profilesSentinel = useInfiniteScroll({
    hasMore: Boolean(profilesCursor),
    loading: profilesResult.isFetching,
    onLoadMore: loadMoreProfiles,
  });

  const visiblePosts = query.trim() ? posts : trendingPosts;
  const authorIds = useMemo(
    () => visiblePosts.map((post) => post.authorId),
    [visiblePosts]
  );
  const { profiles: authorProfiles } = useProfilesMap(authorIds);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className={`${pageStyles.page} ${styles.searchPage}`}>
      <div className={styles.searchHeader}>
        <form onSubmit={handleSubmit}>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts or people"
            aria-label="Search"
          />
        </form>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === "posts" ? styles.tabButtonActive : ""}`}
            type="button"
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "people" ? styles.tabButtonActive : ""}`}
            type="button"
            onClick={() => setActiveTab("people")}
          >
            People
          </button>
        </div>
      </div>

      {activeTab === "posts" && query.trim() && (
        <div className={styles.results}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} author={authorProfiles.get(post.authorId)} />
          ))}
          {postsResult.isFetching && <div className={styles.status}>Loading posts...</div>}
          {postsResult.error && <div className={pageStyles.error}>Unable to search posts.</div>}
          <div ref={postsSentinel} className={styles.sentinel} />
          {!postsResult.isFetching && posts.length === 0 && query.trim() && (
            <div className={styles.status}>No posts matched that search.</div>
          )}
        </div>
      )}

      {activeTab === "posts" && !query.trim() && (
        <div className={styles.results}>
          <div className={styles.sectionHeader}>Popular right now</div>
          {trendingPosts.map((post) => (
            <PostCard key={post.id} post={post} author={authorProfiles.get(post.authorId)} />
          ))}
          {trendingResult.isFetching && <div className={styles.status}>Loading trending posts...</div>}
          {trendingResult.error && <div className={pageStyles.error}>Unable to load trending posts.</div>}
          <div ref={trendingSentinel} className={styles.sentinel} />
          {!trendingResult.isFetching && trendingPosts.length === 0 && (
            <div className={styles.status}>No trending posts yet.</div>
          )}
        </div>
      )}

      {activeTab === "people" && (
        <div className={styles.results}>
          {profiles.map((profile) => {
            const profileHref = profile.username?.trim()
              ? `/profile?username=${encodeURIComponent(profile.username.trim())}`
              : `/profile?userId=${encodeURIComponent(profile.userId)}`;
            const label = (profile.nickname || profile.username || "??").slice(0, 2).toUpperCase();
            return (
              <Link key={profile.userId} href={profileHref} className={styles.profileCard}>
                <div className={styles.profileAvatar}>
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.nickname ?? "avatar"} />
                  ) : (
                    label
                  )}
                </div>
                <div className={styles.profileMeta}>
                  <div className={styles.profileName}>{profile.nickname ?? "New user"}</div>
                  <div className={styles.profileHandle}>@{profile.username ?? profile.userId.slice(0, 8)}</div>
                </div>
              </Link>
            );
          })}
          {profilesResult.isFetching && <div className={styles.status}>Loading people...</div>}
          {profilesResult.error && <div className={pageStyles.error}>Unable to search users.</div>}
          <div ref={profilesSentinel} className={styles.sentinel} />
          {!profilesResult.isFetching && profiles.length === 0 && query.trim() && (
            <div className={styles.status}>No profiles matched that search.</div>
          )}
        </div>
      )}
    </div>
  );
}
