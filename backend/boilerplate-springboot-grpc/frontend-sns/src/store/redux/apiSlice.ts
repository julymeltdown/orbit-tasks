"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { env } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";
import type {
  FeedResponse,
  FollowActionResponse,
  FollowCountsResponse,
  FollowListResponse,
  FollowStatusResponse,
  CommentResponse,
  PostDetailResponse,
  PostLikeResponse,
  PostResponse,
  ProfileBatchResponse,
  ProfileSearchResponse,
} from "@/lib/types";

const baseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Feed", "Post", "Profile", "Follow", "Search", "Trending"],
  endpoints: (builder) => ({
    getFeed: builder.query<FeedResponse, { cursor?: string | null; limit?: number }>({
      query: ({ cursor, limit } = {}) => ({
        url: "/api/feed",
        params: {
          ...(cursor ? { cursor } : {}),
          ...(limit ? { limit } : {}),
        },
      }),
      providesTags: ["Feed"],
    }),
    getAuthorPosts: builder.query<FeedResponse, { authorId: string; cursor?: string | null; limit?: number }>({
      query: ({ authorId, cursor, limit }) => ({
        url: `/api/posts/author/${encodeURIComponent(authorId)}`,
        params: {
          ...(cursor ? { cursor } : {}),
          ...(limit ? { limit } : {}),
        },
      }),
      providesTags: (_result, _error, args) => [{ type: "Profile", id: args.authorId }],
    }),
    searchPosts: builder.query<FeedResponse, { query: string; cursor?: string | null; limit?: number }>({
      query: ({ query, cursor, limit }) => ({
        url: "/api/posts/search",
        params: {
          q: query,
          ...(cursor ? { cursor } : {}),
          ...(limit ? { limit } : {}),
        },
      }),
      providesTags: ["Search"],
    }),
    getTrendingPosts: builder.query<FeedResponse, { cursor?: string | null; limit?: number }>({
      query: ({ cursor, limit } = {}) => ({
        url: "/api/posts/trending",
        params: {
          ...(cursor ? { cursor } : {}),
          ...(limit ? { limit } : {}),
        },
      }),
      providesTags: ["Trending"],
    }),
    getPost: builder.query<PostDetailResponse, string>({
      query: (postId) => `/api/posts/${encodeURIComponent(postId)}`,
      providesTags: (_result, _error, postId) => [{ type: "Post", id: postId }],
    }),
    createPost: builder.mutation<PostResponse, { content: string; visibility: string }>({
      query: (payload) => ({
        url: "/api/posts",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Feed", "Search"],
    }),
    createComment: builder.mutation<CommentResponse, { postId: string; content: string }>({
      query: ({ postId, content }) => ({
        url: `/api/posts/${encodeURIComponent(postId)}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Post", id: arg.postId },
        "Feed",
      ],
    }),
    likePost: builder.mutation<PostLikeResponse, { postId: string }>({
      query: ({ postId }) => ({
        url: `/api/posts/${encodeURIComponent(postId)}/likes`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Post", id: arg.postId },
        "Feed",
        "Search",
        "Trending",
      ],
    }),
    unlikePost: builder.mutation<PostLikeResponse, { postId: string }>({
      query: ({ postId }) => ({
        url: `/api/posts/${encodeURIComponent(postId)}/likes`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Post", id: arg.postId },
        "Feed",
        "Search",
        "Trending",
      ],
    }),
    getProfilesBatch: builder.query<ProfileBatchResponse, string[]>({
      query: (userIds) => ({
        url: "/api/profile/batch",
        method: "POST",
        body: { userIds },
      }),
      providesTags: (result) =>
        result?.profiles?.map((profile) => ({ type: "Profile" as const, id: profile.userId })) ??
        ["Profile"],
    }),
    searchProfiles: builder.query<ProfileSearchResponse, { query: string; cursor?: string | null; limit?: number }>({
      query: ({ query, cursor, limit }) => ({
        url: "/api/profile/search",
        params: {
          q: query,
          ...(cursor ? { cursor } : {}),
          ...(limit ? { limit } : {}),
        },
      }),
      providesTags: ["Search"],
    }),
    getFollowers: builder.query<FollowListResponse, { userId?: string; cursor?: string | null; limit?: number }>({
      query: ({ userId, cursor, limit } = {}) => ({
        url: "/api/follows/followers",
        params: {
          ...(userId ? { userId } : {}),
          ...(cursor ? { cursor } : {}),
          ...(limit ? { limit } : {}),
        },
      }),
      providesTags: ["Follow"],
    }),
    getFollowing: builder.query<FollowListResponse, { userId?: string; cursor?: string | null; limit?: number }>({
      query: ({ userId, cursor, limit } = {}) => ({
        url: "/api/follows/following",
        params: {
          ...(userId ? { userId } : {}),
          ...(cursor ? { cursor } : {}),
          ...(limit ? { limit } : {}),
        },
      }),
      providesTags: ["Follow"],
    }),
    getFollowCounts: builder.query<FollowCountsResponse, { userId?: string }>({
      query: ({ userId } = {}) => ({
        url: "/api/follows/counts",
        params: {
          ...(userId ? { userId } : {}),
        },
      }),
      providesTags: ["Follow"],
    }),
    getFollowStatus: builder.query<FollowStatusResponse, { targetUserId: string }>({
      query: ({ targetUserId }) => ({
        url: "/api/follows/status",
        params: {
          targetUserId,
        },
      }),
      providesTags: ["Follow"],
    }),
    followUser: builder.mutation<FollowActionResponse, { targetUserId: string }>({
      query: (payload) => ({
        url: "/api/follows",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Follow"],
    }),
    unfollowUser: builder.mutation<FollowActionResponse, { targetUserId: string }>({
      query: ({ targetUserId }) => ({
        url: `/api/follows/${encodeURIComponent(targetUserId)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Follow"],
    }),
  }),
});

export const {
  useGetFeedQuery,
  useLazyGetFeedQuery,
  useGetAuthorPostsQuery,
  useLazyGetAuthorPostsQuery,
  useSearchPostsQuery,
  useLazySearchPostsQuery,
  useGetTrendingPostsQuery,
  useLazyGetTrendingPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useCreateCommentMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useGetProfilesBatchQuery,
  useSearchProfilesQuery,
  useLazySearchProfilesQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useLazyGetFollowersQuery,
  useLazyGetFollowingQuery,
  useGetFollowCountsQuery,
  useGetFollowStatusQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
} = apiSlice;
