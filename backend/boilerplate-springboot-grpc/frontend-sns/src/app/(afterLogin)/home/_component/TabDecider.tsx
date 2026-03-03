"use client";

import { useContext } from "react";
import { TabContext } from "@/app/(afterLogin)/home/_component/TabProvider";
import FeedList from "@/app/(afterLogin)/home/_component/FeedList";

export default function TabDecider() {
  const { tab } = useContext(TabContext);
  if (tab === "rec") {
    return <FeedList key="feed-rec" />;
  }
  return <FeedList key="feed-following" />;
}
