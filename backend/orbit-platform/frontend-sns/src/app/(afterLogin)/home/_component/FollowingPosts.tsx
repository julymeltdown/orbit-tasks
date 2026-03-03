"use client";

import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { getFollowingPosts } from "@/app/(afterLogin)/home/_lib/getFollowingPosts";
import Post from "@/app/(afterLogin)/_component/Post";
import type { FeedResponse } from "@/lib/types";
import { Fragment } from "react";

export default function FollowingPosts() {
  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery<
    FeedResponse,
    Error,
    InfiniteData<FeedResponse>,
    [string, string],
    string | null
  >({
    queryKey: ["feed", "following"],
    queryFn: getFollowingPosts,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  return (
    <>
      {data?.pages?.map((page, index) => (
        <Fragment key={index}>
          {page.posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </Fragment>
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetching}
          style={{ margin: "16px auto", padding: "8px 16px" }}
        >
          {isFetching ? "Loading..." : "Load more"}
        </button>
      )}
    </>
  );
}
