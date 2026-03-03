"use client";

import { useMemo } from "react";
import { useGetProfilesBatchQuery } from "@/store/redux/apiSlice";
import type { ProfileResponse } from "@/lib/types";

export function useProfilesMap(userIds: string[]) {
  const normalizedIds = useMemo(() => {
    const set = new Set(userIds.filter((id) => id && id.trim()));
    return Array.from(set).sort();
  }, [userIds]);

  const { data, isLoading, error } = useGetProfilesBatchQuery(normalizedIds, {
    skip: normalizedIds.length === 0,
  });

  const profiles = useMemo(() => {
    const map = new Map<string, ProfileResponse>();
    data?.profiles?.forEach((profile) => {
      map.set(profile.userId, profile);
    });
    return map;
  }, [data]);

  return { profiles, isLoading, error };
}
