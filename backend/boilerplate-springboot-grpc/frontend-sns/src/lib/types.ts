export type AuthResponse = {
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
  expiresIn: number;
  linkedProviders: string[];
};

export type SignupResponse = {
  userId: string;
  status: string;
};

export type EmailAvailabilityResponse = {
  email: string;
  available: boolean;
  status: string;
};

export type LinkedProvidersResponse = {
  userId: string;
  providers: string[];
};

export type ProfileResponse = {
  userId: string;
  username?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
};

export type ProfileUpdateRequest = {
  username?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type ProfileBatchRequest = {
  userIds: string[];
};

export type ProfileBatchResponse = {
  profiles: ProfileResponse[];
};

export type ProfileSearchResponse = {
  profiles: ProfileResponse[];
  nextCursor?: string | null;
};

export type AvatarUploadResponse = {
  avatarUrl: string;
};

export type PostResponse = {
  id: string;
  authorId: string;
  content: string;
  visibility: string;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
};

export type FeedResponse = {
  posts: PostResponse[];
  nextCursor?: string | null;
};

export type CommentResponse = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
};

export type PostDetailResponse = {
  post: PostResponse;
  comments: CommentResponse[];
};

export type PostLikeResponse = {
  postId: string;
  likeCount: number;
  liked: boolean;
};

export type FollowEdgeResponse = {
  userId: string;
  followedAt: string;
};

export type FollowListResponse = {
  edges: FollowEdgeResponse[];
  nextCursor?: string | null;
  totalCount: number;
};

export type FollowCountsResponse = {
  followerCount: number;
  followingCount: number;
};

export type FollowStatusResponse = {
  following: boolean;
};

export type FollowActionResponse = {
  following: boolean;
  followedAt?: string | null;
};

export type NotificationResponse = {
  id: string;
  userId: string;
  type: string;
  payloadJson: string;
  createdAt: string;
  readAt?: string | null;
};

export type NotificationFeedResponse = {
  items: NotificationResponse[];
  nextCursor?: string | null;
};

export type NotificationMarkAllReadResponse = {
  updatedCount: number;
};

export type AggregationResponse = {
  routeKey: string;
  cached: boolean;
  payload: Record<string, unknown>;
};
