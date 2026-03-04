import { request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";

export interface BasicProfile {
  userId: string;
  username: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
}

export interface ProfileCompletionResult {
  complete: boolean;
  profile: BasicProfile | null;
}

function isFilled(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function isProfileComplete(profile: Pick<BasicProfile, "username" | "nickname" | "avatarUrl" | "bio">): boolean {
  return isFilled(profile.username) && isFilled(profile.nickname) && isFilled(profile.avatarUrl) && isFilled(profile.bio);
}

export async function fetchProfileCompletion(): Promise<ProfileCompletionResult> {
  const userId = useAuthStore.getState().userId;
  if (!userId) {
    return {
      complete: false,
      profile: null
    };
  }

  const profile = await request<BasicProfile>(`/api/profile/${encodeURIComponent(userId)}`);
  return {
    complete: isProfileComplete(profile),
    profile
  };
}

