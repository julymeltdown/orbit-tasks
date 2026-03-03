"use client";

import style from "./followRecommend.module.css";
import Link from "next/link";
import type { ProfileResponse } from "@/lib/types";

type Props = {
  userId: string;
  profile?: ProfileResponse;
};

export default function FollowRecommend({ userId, profile }: Props) {
  const username = profile?.username?.trim() || userId.slice(0, 8);
  const displayName = profile?.nickname?.trim() || "New user";
  const avatarLabel = (displayName || username).slice(0, 2).toUpperCase();
  const profileHref = profile?.username?.trim()
    ? `/profile?username=${encodeURIComponent(profile.username.trim())}`
    : `/profile?userId=${encodeURIComponent(userId)}`;

  return (
    <Link href={profileHref} className={style.container}>
      <div className={style.userLogoSection}>
        {profile?.avatarUrl ? (
          <img className={style.userLogo} src={profile.avatarUrl} alt={displayName} />
        ) : (
          <div className={style.userLogo}>{avatarLabel}</div>
        )}
      </div>
      <div className={style.userInfo}>
        <div className={style.title}>{displayName}</div>
        <div className={style.count}>@{username}</div>
      </div>
      <div className={style.followButtonSection}>
        <span>View</span>
      </div>
    </Link>
  );
}
