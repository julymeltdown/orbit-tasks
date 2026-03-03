"use client";

import FollowRecommend from "@/app/(afterLogin)/_component/FollowRecommend";
import { useGetFollowingQuery } from "@/store/redux/apiSlice";
import { useProfilesMap } from "@/hooks/useProfilesMap";

export default function FollowRecommendSection() {
  const { data, error, isLoading } = useGetFollowingQuery({ limit: 6 });
  const followingIds = data?.edges?.map((edge) => edge.userId) ?? [];
  const { profiles } = useProfilesMap(followingIds);

  if (isLoading) {
    return <div>Loading following...</div>;
  }

  if (error) {
    return <div>Unable to load following.</div>;
  }

  if (!followingIds.length) {
    return <div>Not following anyone yet.</div>;
  }

  return followingIds.map((userId) => (
    <FollowRecommend userId={userId} profile={profiles.get(userId)} key={userId} />
  ));
}
