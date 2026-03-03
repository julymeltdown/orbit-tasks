"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { authApi } from "@/lib/api";
import type { EmailAvailabilityResponse } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { alertForError } from "@/lib/errorMapper";

type SignupEmailClientProps = {
  initialEmail?: string;
};

export default function SignupEmailClient({ initialEmail = "" }: SignupEmailClientProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<EmailAvailabilityResponse | null>(null);

  const emailValid = useMemo(() => {
    if (!email) {
      return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace("/home");
    }
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleNext = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAvailability(null);
    if (!emailValid) {
      setError("Enter a valid email address.");
      return;
    }
    setChecking(true);
    try {
      const response = await authApi.checkEmail({ email });
      setAvailability(response);
      if (response.available) {
        sessionStorage.setItem("signupEmail", response.email);
        router.push(`/auth/signup/password?email=${encodeURIComponent(response.email)}`);
        return;
      }
      if (response.status === "TAKEN") {
        setError("This email is already registered.");
      } else if (response.status === "INVALID") {
        setError("This email is not valid for signup.");
      } else {
        setError("This email is not allowed for signup.");
      }
    } catch (error) {
      const message = alertForError(error);
      setError(message);
    } finally {
      setChecking(false);
    }
  };

  const triggerAuthorize = (provider: string) => {
    window.location.href = authApi.oauthAuthorizeUrl(provider);
  };

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.heroBadge}>Sign up</span>
          <h1 className={styles.heroTitle}>Start with your email.</h1>
          <p className={styles.heroCopy}>
            We will confirm your address before activating the account.
          </p>
          <div className={styles.stepper}>
            <span className={`${styles.step} ${styles.stepActive}`}>1 Email</span>
            <span className={styles.step}>2 Password</span>
            <span className={styles.step}>3 Verify</span>
          </div>
          <Link className={styles.textLink} href="/auth/login">
            Already have access? Sign in
          </Link>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelTitle}>Email signup</div>
          <p className={styles.muted}>We will check if this email is available.</p>
          <form onSubmit={handleNext} className={styles.formStack}>
            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            {email.length > 0 && (
              <div className={`${styles.hint} ${emailValid ? styles.hintSuccess : styles.hintError}`}>
                {emailValid ? "Email format looks good." : "Enter a valid email address."}
              </div>
            )}
            {availability?.available && (
              <div className={`${styles.hint} ${styles.hintSuccess}`}>
                Email is available. Continue to set your password.
              </div>
            )}
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.buttonRow}>
              <Link className={styles.textLink} href="/auth">
                Back to options
              </Link>
              <button className={styles.button} type="submit" disabled={!emailValid || checking}>
                {checking ? "Checking..." : "Next"}
              </button>
            </div>
          </form>

          <div className={styles.divider}>or</div>
          <button
            className={styles.oauthButton}
            type="button"
            onClick={() => triggerAuthorize("google")}
          >
            Continue with Google
          </button>
          <button
            className={styles.oauthButton}
            type="button"
            onClick={() => triggerAuthorize("apple")}
          >
            Continue with Apple
          </button>
          <div className={styles.linkRow}>
            Need tools?
            <Link className={styles.textLink} href="/auth/tools">
              Open auth tools
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
