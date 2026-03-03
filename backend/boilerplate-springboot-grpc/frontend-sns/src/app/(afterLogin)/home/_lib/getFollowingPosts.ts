import { postApi } from "@/lib/api";
import type { FeedResponse } from "@/lib/types";

type Props = { pageParam?: string | null };

export async function getFollowingPosts({ pageParam }: Props): Promise<FeedResponse> {
  return postApi.feed(pageParam ?? null);
}
