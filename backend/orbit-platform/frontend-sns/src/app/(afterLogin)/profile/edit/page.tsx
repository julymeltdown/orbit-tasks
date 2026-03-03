"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import styles from "@/app/(afterLogin)/page.module.css";
import { profileApi } from "@/lib/api";
import { env } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";
import type { ProfileResponse } from "@/lib/types";
import { alertForError } from "@/lib/errorMapper";

export default function ProfileEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const selfId = useAuthStore((state) => state.userId);
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bio, setBio] = useState("");
  const [updateResult, setUpdateResult] = useState<ProfileResponse | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const usernameValid = useMemo(() => /^[a-zA-Z0-9_]{3,20}$/.test(username), [username]);

  const { data, error } = useQuery<ProfileResponse>({
    queryKey: ["profile", "self", selfId],
    queryFn: () => profileApi.get(selfId ?? ""),
    enabled: Boolean(selfId),
  });

  useEffect(() => {
    if (data) {
      setUsername(data.username ?? "");
      setNickname(data.nickname ?? "");
      setAvatarUrl(data.avatarUrl ?? "");
      setBio(data.bio ?? "");
    }
  }, [data]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    setUpdateError(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    try {
      const response = await profileApi.uploadAvatar(file);
      const resolvedUrl = response.avatarUrl.startsWith("http")
        ? response.avatarUrl
        : `${env.apiBaseUrl}${response.avatarUrl}`;
      setAvatarUrl(resolvedUrl);
    } catch (err) {
      const message = alertForError(err);
      setUpdateError(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updateProfile = async () => {
    if (!selfId) {
      setUpdateError("No signed-in user.");
      return;
    }
    if (!usernameValid) {
      setUpdateError("Username must be 3–20 characters (letters, numbers, underscore).");
      return;
    }
    if (!nickname.trim()) {
      setUpdateError("Display name is required.");
      return;
    }
    if (!avatarUrl.trim()) {
      setUpdateError("Avatar URL is required.");
      return;
    }
    if (!bio.trim()) {
      setUpdateError("Profile message is required.");
      return;
    }
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateResult(null);
    try {
      const response = await profileApi.update(selfId, {
        username,
        nickname,
        avatarUrl,
        bio,
      });
      setUpdateResult(response);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.replace("/profile");
    } catch (err) {
      const message = alertForError(err);
      setUpdateError(message);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <strong>Complete your profile</strong>
      {error && <div className={styles.error}>Unable to load current profile.</div>}
      <label className={styles.field}>
        Username
        <input
          className={styles.input}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="username"
        />
        {username.length > 0 && (
          <span className={styles.hint}>
            {usernameValid
              ? "Username looks good."
              : "3–20 characters, letters/numbers/underscore only."}
          </span>
        )}
      </label>
      <label className={styles.field}>
        Display name
        <input
          className={styles.input}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Your name"
        />
      </label>
      <label className={styles.field}>
        Profile photo
        <div className={styles.row}>
          <input
            className={styles.input}
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleAvatarUpload(file);
              }
            }}
          />
          {uploadingAvatar && <span className={styles.hint}>Uploading...</span>}
        </div>
        <div className={styles.hint}>
          Upload a square image (max 1MB). The link will be saved to your profile.
        </div>
        {(avatarPreview || avatarUrl) && (
          <div className={styles.hint}>
            <img
              src={avatarPreview || avatarUrl}
              alt="Avatar preview"
              style={{ width: 72, height: 72, borderRadius: 36, objectFit: "cover" }}
            />
          </div>
        )}
      </label>
      <label className={styles.field}>
        Profile message
        <textarea
          className={styles.textarea}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Tell people about you"
        />
      </label>
      <div className={styles.row}>
        <button className={styles.button} type="button" onClick={updateProfile} disabled={updateLoading}>
          {updateLoading ? "Saving..." : "Update profile"}
        </button>
      </div>
      {updateError && <div className={styles.error}>{updateError}</div>}
      {updateResult && (
        <pre className={styles.output}>{JSON.stringify(updateResult, null, 2)}</pre>
      )}
    </section>
  );
}
