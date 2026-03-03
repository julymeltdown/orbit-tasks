"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../onboarding.module.css";
import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { profileApi } from "@/lib/api";
import { alertForError } from "@/lib/errorMapper";
import { useProfileLabel } from "@/hooks/useProfileLabel";

export default function OnboardingStepThree() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const { profile, isLoading } = useProfileLabel(userId);
  const { username, nickname, avatarUrl, bio, reset } = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && profile?.username && profile?.nickname && profile?.avatarUrl && profile?.bio) {
      router.replace("/home");
    }
  }, [isLoading, profile, router]);

  useEffect(() => {
    if (!username || !nickname || !avatarUrl || !bio) {
      router.replace("/onboarding/step-1");
    }
  }, [username, nickname, avatarUrl, bio, router]);

  const handleFinish = async () => {
    if (!userId) {
      setError("No signed-in user.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await profileApi.update(userId, {
        username,
        nickname,
        avatarUrl,
        bio,
      });
      reset();
      window.alert("프로필 설정이 완료되었습니다.");
      router.replace("/profile");
    } catch (err) {
      const message = alertForError(err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.headerBadge}>Profile setup</span>
        <h1 className={styles.title}>Review and finish.</h1>
        <p className={styles.subtitle}>
          마지막으로 입력한 내용을 확인하고 계정을 활성화하세요.
        </p>
        <div className={styles.stepper}>
          <span className={styles.step}>1 Basics</span>
          <span className={styles.step}>2 Profile</span>
          <span className={`${styles.step} ${styles.stepActive}`}>3 Finish</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <strong>Username</strong>
            <span>@{username}</span>
          </div>
          <div className={styles.summaryRow}>
            <strong>Display name</strong>
            <span>{nickname}</span>
          </div>
          <div className={styles.summaryRow}>
            <strong>Profile photo</strong>
            <span>{avatarUrl ? "Ready" : "Missing"}</span>
          </div>
          <div className={styles.summaryRow}>
            <strong>Bio</strong>
            <span>{bio.length > 40 ? `${bio.slice(0, 40)}...` : bio}</span>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.buttonRow}>
          <button
            className={styles.buttonSecondary}
            type="button"
            onClick={() => router.push("/onboarding/step-2")}
            disabled={saving}
          >
            Back
          </button>
          <button
            className={styles.buttonPrimary}
            type="button"
            onClick={handleFinish}
            disabled={saving}
          >
            {saving ? "Saving..." : "Complete setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
