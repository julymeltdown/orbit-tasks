"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api";
import type { ProfileResponse } from "@/lib/types";

export function useProfileLabel(userId?: string) {
  const { data, isLoading, error } = useQuery<ProfileResponse>({
    queryKey: ["profile", userId],
    queryFn: () => profileApi.get(userId ?? ""),
    enabled: Boolean(userId),
  });

  const username = data?.username?.trim() || "pending";
  const displayName = data?.nickname?.trim() || "New user";
  const avatarLabel = (displayName || username).slice(0, 2).toUpperCase();

  return {
    profile: data,
    username,
    displayName,
    avatarLabel,
    isLoading,
    error,
  };
}
