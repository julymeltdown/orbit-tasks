export type FollowTab = "followers" | "following";

type ProfileLinkInput = {
  userId: string;
  username?: string | null;
};

type FollowListLinkInput = ProfileLinkInput & {
  tab: FollowTab;
};

export function normalizeFollowTab(tab: string | null | undefined): FollowTab {
  return tab === "following" ? "following" : "followers";
}

export function buildProfileHref({ userId, username }: ProfileLinkInput) {
  const trimmed = username?.trim();
  if (trimmed) {
    return `/profile?username=${encodeURIComponent(trimmed)}`;
  }
  return `/profile?userId=${encodeURIComponent(userId)}`;
}

export function buildFollowListHref({ userId, username, tab }: FollowListLinkInput) {
  const trimmed = username?.trim();
  if (trimmed) {
    return `/profile/follows?username=${encodeURIComponent(trimmed)}&tab=${tab}`;
  }
  return `/profile/follows?userId=${encodeURIComponent(userId)}&tab=${tab}`;
}
