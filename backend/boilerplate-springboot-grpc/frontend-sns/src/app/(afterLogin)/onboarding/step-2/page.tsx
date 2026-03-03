"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "../onboarding.module.css";
import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useProfileLabel } from "@/hooks/useProfileLabel";
import { profileApi } from "@/lib/api";
import { env } from "@/lib/env";
import { alertForError } from "@/lib/errorMapper";

export default function OnboardingStepTwo() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const { profile, isLoading } = useProfileLabel(userId);
  const { username, nickname, avatarUrl, bio, setField } = useOnboardingStore();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && profile?.username && profile?.nickname && profile?.avatarUrl && profile?.bio) {
      router.replace("/home");
    }
  }, [isLoading, profile, router]);

  useEffect(() => {
    if (!username || !nickname) {
      router.replace("/onboarding/step-1");
    }
  }, [username, nickname, router]);

  const avatarLabel = useMemo(() => {
    const source = nickname || username || "";
    return source.slice(0, 2).toUpperCase();
  }, [nickname, username]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarUpload = async (file: File) => {
    setUploadError(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploading(true);
    try {
      const response = await profileApi.uploadAvatar(file);
      const resolvedUrl = response.avatarUrl.startsWith("http")
        ? response.avatarUrl
        : `${env.apiBaseUrl}${response.avatarUrl}`;
      setField("avatarUrl", resolvedUrl);
    } catch (err) {
      setUploadError(alertForError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleNext = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (uploading) {
      setError("이미지 업로드가 완료될 때까지 기다려 주세요.");
      return;
    }
    if (!avatarUrl.trim()) {
      setError("프로필 사진을 업로드해 주세요.");
      return;
    }
    if (!bio.trim()) {
      setError("프로필 메시지를 입력해 주세요.");
      return;
    }
    router.push("/onboarding/step-3");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.headerBadge}>Profile setup</span>
        <h1 className={styles.title}>Add a photo and short bio.</h1>
        <p className={styles.subtitle}>
          People will see this on your profile card and when you post.
        </p>
        <div className={styles.stepper}>
          <span className={styles.step}>1 Basics</span>
          <span className={`${styles.step} ${styles.stepActive}`}>2 Profile</span>
          <span className={styles.step}>3 Finish</span>
        </div>
      </div>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleNext}>
          <label className={styles.label}>
            Profile photo
            <div className={styles.previewRow}>
              <div className={styles.avatarPreview}>
                {avatarPreview || avatarUrl ? (
                  <img src={avatarPreview || avatarUrl} alt="preview" />
                ) : (
                  avatarLabel
                )}
              </div>
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
                required={!avatarUrl}
              />
            </div>
            <span className={styles.hint}>정사각형 이미지를 추천합니다. (최대 1MB)</span>
            {uploading && <span className={styles.hint}>Uploading...</span>}
            {uploadError && <span className={styles.error}>{uploadError}</span>}
          </label>
          <label className={styles.label}>
            Profile message
            <textarea
              className={styles.textarea}
              value={bio}
              onChange={(event) => setField("bio", event.target.value)}
              placeholder="Tell people about you"
              required
            />
          </label>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.buttonRow}>
            <button
              className={styles.buttonSecondary}
              type="button"
              onClick={() => router.push("/onboarding/step-1")}
            >
              Back
            </button>
            <button className={styles.buttonPrimary} type="submit" disabled={uploading}>
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
