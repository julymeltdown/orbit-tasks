"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "../onboarding.module.css";
import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { profileApi } from "@/lib/api";
import { alertForError, getErrorCode } from "@/lib/errorMapper";
import { useProfileLabel } from "@/hooks/useProfileLabel";

export default function OnboardingStepOne() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const { profile, isLoading } = useProfileLabel(userId);
  const { username, nickname, setField } = useOnboardingStore();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const usernameValid = useMemo(() => /^[a-zA-Z0-9_]{3,20}$/.test(username), [username]);

  useEffect(() => {
    if (!isLoading && profile?.username && profile?.nickname && profile?.avatarUrl && profile?.bio) {
      router.replace("/home");
    }
  }, [isLoading, profile, router]);

  const handleNext = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!usernameValid) {
      setError("유저네임은 3~20자 영문/숫자/언더스코어만 가능합니다.");
      return;
    }
    if (!nickname.trim()) {
      setError("사용자 이름을 입력해 주세요.");
      return;
    }
    setChecking(true);
    try {
      await profileApi.getByUsername(username);
      setError("이미 사용 중인 유저네임입니다.");
    } catch (err) {
      const status = (err as { status?: number }).status;
      const code = getErrorCode(err);
      if (status === 404 || code === "GATEWAY_NOT_FOUND") {
        router.push("/onboarding/step-2");
      } else {
        const message = alertForError(err);
        setError(message);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.headerBadge}>Profile setup</span>
        <h1 className={styles.title}>Pick a username and display name.</h1>
        <p className={styles.subtitle}>
          This will appear on your profile and posts. You can change it later.
        </p>
        <div className={styles.stepper}>
          <span className={`${styles.step} ${styles.stepActive}`}>1 Basics</span>
          <span className={styles.step}>2 Profile</span>
          <span className={styles.step}>3 Finish</span>
        </div>
      </div>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleNext}>
          <label className={styles.label}>
            Username
            <input
              className={styles.input}
              value={username}
              onChange={(event) => setField("username", event.target.value)}
              placeholder="yourname"
              required
            />
            <span className={styles.hint}>
              {username.length === 0
                ? "3~20자 영문/숫자/언더스코어"
                : usernameValid
                ? "유저네임 형식이 좋아요."
                : "유저네임 형식을 확인해 주세요."}
            </span>
          </label>
          <label className={styles.label}>
            Display name
            <input
              className={styles.input}
              value={nickname}
              onChange={(event) => setField("nickname", event.target.value)}
              placeholder="Your name"
              required
            />
          </label>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.buttonRow}>
            <button className={styles.buttonPrimary} type="submit" disabled={checking}>
              {checking ? "Checking..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
