"use client";

import { apiClient } from "@/lib/apiClient";
import { env } from "@/lib/env";
import type {
  AggregationResponse,
  AuthResponse,
  AvatarUploadResponse,
  CommentResponse,
  EmailAvailabilityResponse,
  FeedResponse,
  FollowActionResponse,
  FollowCountsResponse,
  FollowListResponse,
  FollowStatusResponse,
  LinkedProvidersResponse,
  NotificationFeedResponse,
  NotificationMarkAllReadResponse,
  NotificationResponse,
  PostDetailResponse,
  PostResponse,
  ProfileBatchRequest,
  ProfileBatchResponse,
  ProfileSearchResponse,
  ProfileResponse,
  ProfileUpdateRequest,
  SignupResponse,
} from "@/lib/types";

export const authApi = {
  signup: (payload: { email: string; password: string }) =>
    apiClient.post<SignupResponse>("/auth/email/signup", payload, { skipAuth: true }),
  verify: (payload: { email: string; code: string }) =>
    apiClient.post<SignupResponse>("/auth/email/verify", payload, { skipAuth: true }),
  checkEmail: (payload: { email: string }) =>
    apiClient.post<EmailAvailabilityResponse>("/auth/email/check", payload, { skipAuth: true }),
  login: (payload: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/auth/login", payload, { skipAuth: true }),
  refresh: () => apiClient.post<AuthResponse>("/auth/refresh", undefined, { skipAuth: true }),
  logout: () => apiClient.post<void>("/auth/logout"),
  oauthAuthorizeUrl: (provider: string) => `${env.apiBaseUrl}/auth/oauth/${provider}/authorize`,
  oauthCallback: (provider: string, code: string, state: string) =>
    apiClient.get<AuthResponse>(
      `/auth/oauth/${provider}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      { skipAuth: true }
    ),
  oauthLink: (provider: string, payload: { code: string; state: string }) =>
    apiClient.post<LinkedProvidersResponse>(`/auth/oauth/${provider}/link`, payload),
};

export const profileApi = {
  get: (userId: string) => apiClient.get<ProfileResponse>(`/api/profile/${userId}`),
  getByUsername: (username: string) =>
    apiClient.get<ProfileResponse>(`/api/profile/username/${encodeURIComponent(username)}`),
  batch: (payload: ProfileBatchRequest) =>
    apiClient.post<ProfileBatchResponse>("/api/profile/batch", payload),
  search: (query: string, cursor?: string | null, limit?: number) => {
    const params = new URLSearchParams();
    params.set("q", query);
    if (cursor) {
      params.set("cursor", cursor);
    }
    if (limit) {
      params.set("limit", String(limit));
    }
    const queryString = params.toString();
    return apiClient.get<ProfileSearchResponse>(`/api/profile/search?${queryString}`);
  },
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<AvatarUploadResponse>("/api/profile/avatar", formData, {
      isFormData: true,
    });
  },
  update: (userId: string, payload: ProfileUpdateRequest) =>
    apiClient.put<ProfileResponse>(`/api/profile/${userId}`, payload),
};

export const postApi = {
  feed: (cursor?: string | null) => {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiClient.get<FeedResponse>(`/api/feed${query}`);
  },
  byAuthor: (authorId: string, cursor?: string | null, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) {
      params.set("cursor", cursor);
    }
    if (limit) {
      params.set("limit", String(limit));
    }
    const query = params.toString();
    return apiClient.get<FeedResponse>(
      `/api/posts/author/${encodeURIComponent(authorId)}${query ? `?${query}` : ""}`
    );
  },
  search: (queryValue: string, cursor?: string | null, limit?: number) => {
    const params = new URLSearchParams();
    params.set("q", queryValue);
    if (cursor) {
      params.set("cursor", cursor);
    }
    if (limit) {
      params.set("limit", String(limit));
    }
    const query = params.toString();
    return apiClient.get<FeedResponse>(`/api/posts/search?${query}`);
  },
  detail: (postId: string) =>
    apiClient.get<PostDetailResponse>(`/api/posts/${encodeURIComponent(postId)}`),
  create: (payload: { content: string; visibility: string }) =>
    apiClient.post<PostResponse>("/api/posts", payload),
  comment: (postId: string, payload: { content: string }) =>
    apiClient.post<CommentResponse>(`/api/posts/${postId}/comments`, payload),
};

export const followApi = {
  followers: (params: { userId?: string; cursor?: string | null; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.userId) query.set("userId", params.userId);
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query}` : "";
    return apiClient.get<FollowListResponse>(`/api/follows/followers${suffix}`);
  },
  following: (params: { userId?: string; cursor?: string | null; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.userId) query.set("userId", params.userId);
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query}` : "";
    return apiClient.get<FollowListResponse>(`/api/follows/following${suffix}`);
  },
  counts: (userId?: string) => {
    const suffix = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return apiClient.get<FollowCountsResponse>(`/api/follows/counts${suffix}`);
  },
  status: (targetUserId: string) =>
    apiClient.get<FollowStatusResponse>(
      `/api/follows/status?targetUserId=${encodeURIComponent(targetUserId)}`
    ),
  follow: (targetUserId: string) =>
    apiClient.post<FollowActionResponse>("/api/follows", { targetUserId }),
  unfollow: (targetUserId: string) =>
    apiClient.request<FollowActionResponse>(`/api/follows/${encodeURIComponent(targetUserId)}`, {
      method: "DELETE",
    }),
};

export const notificationApi = {
  list: (cursor?: string | null, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) {
      params.set("cursor", cursor);
    }
    if (limit) {
      params.set("limit", String(limit));
    }
    const query = params.toString();
    return apiClient.get<NotificationFeedResponse>(`/api/notifications${query ? `?${query}` : ""}`);
  },
  markRead: (notificationId: string) =>
    apiClient.patch<NotificationResponse>(`/api/notifications/${encodeURIComponent(notificationId)}/read`),
  markAllRead: () => apiClient.patch<NotificationMarkAllReadResponse>("/api/notifications/read-all"),
};

export const aggregationApi = {
  get: (routeKey: string) => apiClient.get<AggregationResponse>(`/api/aggregate/${routeKey}`),
};

export const adminApi = {
  telemetrySummary: () => apiClient.get<Record<string, unknown>>("/admin/telemetry/summary"),
  policies: {
    list: () => apiClient.get<Record<string, unknown>[]>("/admin/policies"),
    get: (policyId: string) => apiClient.get<Record<string, unknown>>(`/admin/policies/${policyId}`),
    create: (payload: Record<string, unknown>) =>
      apiClient.post<Record<string, unknown>>("/admin/policies", payload),
    update: (policyId: string, payload: Record<string, unknown>) =>
      apiClient.put<Record<string, unknown>>(`/admin/policies/${policyId}`, payload),
  },
  contracts: {
    list: () => apiClient.get<Record<string, unknown>[]>("/admin/contracts"),
    create: (payload: Record<string, unknown>) =>
      apiClient.post<Record<string, unknown>>("/admin/contracts", payload),
    get: (contractId: string) =>
      apiClient.get<Record<string, unknown>>(`/admin/contracts/${contractId}`),
    versions: (contractId: string) =>
      apiClient.get<Record<string, unknown>[]>(`/admin/contracts/${contractId}/versions`),
    createVersion: (contractId: string, payload: Record<string, unknown>) =>
      apiClient.post<Record<string, unknown>>(`/admin/contracts/${contractId}/versions`, payload),
    getVersion: (contractId: string, version: string) =>
      apiClient.get<Record<string, unknown>>(`/admin/contracts/${contractId}/versions/${version}`),
    updateVersion: (contractId: string, version: string, payload: Record<string, unknown>) =>
      apiClient.patch<Record<string, unknown>>(
        `/admin/contracts/${contractId}/versions/${version}`,
        payload
      ),
  },
  clients: {
    list: () => apiClient.get<Record<string, unknown>[]>("/admin/clients"),
    get: (clientId: string) => apiClient.get<Record<string, unknown>>(`/admin/clients/${clientId}`),
    create: (payload: Record<string, unknown>) =>
      apiClient.post<Record<string, unknown>>("/admin/clients", payload),
  },
  rollouts: {
    create: (payload: Record<string, unknown>) =>
      apiClient.post<Record<string, unknown>>("/admin/rollouts", payload),
    get: (rolloutId: string) => apiClient.get<Record<string, unknown>>(`/admin/rollouts/${rolloutId}`),
  },
};
