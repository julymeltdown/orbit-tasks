"use client";

import style from "./logoutButton.module.css";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useProfileLabel } from "@/hooks/useProfileLabel";

export default function LogoutButton() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  if (!userId) {
    return null;
  }

  const { profile, username, avatarLabel } = useProfileLabel(userId);
  const avatarUrl = profile?.avatarUrl?.trim();

  const onProfile = () => {
    router.push("/profile");
  };

  return (
    <button className={style.logOutButton} onClick={onProfile}>
      <div className={style.logOutUserImage}>
        {avatarUrl ? <img src={avatarUrl} alt={username} /> : <div className={style.avatar}>{avatarLabel}</div>}
      </div>
      <div className={style.logOutUserName}>
        <div>My profile</div>
        <div>@{username}</div>
      </div>
    </button>
  );
}
