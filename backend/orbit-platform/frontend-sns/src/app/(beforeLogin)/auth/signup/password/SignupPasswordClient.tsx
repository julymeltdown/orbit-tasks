"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../../auth.module.css";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { alertForError } from "@/lib/errorMapper";

type SignupPasswordClientProps = {
  email?: string;
};

export default function SignupPasswordClient({ email = "" }: SignupPasswordClientProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [resolvedEmail, setResolvedEmail] = useState(email);
  const [emailReady, setEmailReady] = useState(false);
  const [password, setPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordRules = useMemo(() => {
    const lengthOk = password.length >= 8 && password.length <= 128;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return { lengthOk, hasLetter, hasNumber };
  }, [password]);

  const passwordValid = passwordRules.lengthOk && passwordRules.hasLetter && passwordRules.hasNumber;

  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace("/home");
    }
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    if (email) {
      setResolvedEmail(email);
      sessionStorage.setItem("signupEmail", email);
      setEmailReady(true);
      return;
    }
    const searchEmail = new URLSearchParams(window.location.search).get("email");
    if (searchEmail) {
      setResolvedEmail(searchEmail);
      sessionStorage.setItem("signupEmail", searchEmail);
      setEmailReady(true);
      return;
    }
    const storedEmail = sessionStorage.getItem("signupEmail");
    if (storedEmail) {
      setResolvedEmail(storedEmail);
    }
    setEmailReady(true);
  }, [email]);

  useEffect(() => {
    if (emailReady && !resolvedEmail) {
      router.replace("/auth/signup");
    }
  }, [emailReady, resolvedEmail, router]);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupError(null);
    if (!resolvedEmail) {
      setSignupError("Email is required.");
      return;
    }
    if (!passwordValid) {
      setSignupError("Password must be 8–128 characters and include letters and numbers.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.signup({
        email: resolvedEmail,
        password,
      });
      sessionStorage.removeItem("signupEmail");
      router.push(`/auth/verify?email=${encodeURIComponent(resolvedEmail)}`);
    } catch (error) {
      const message = alertForError(error);
      setSignupError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const emailTaken = signupError?.toLowerCase().includes("already") ?? false;

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.heroBadge}>Sign up</span>
          <h1 className={styles.heroTitle}>Create a secure password.</h1>
          <p className={styles.heroCopy}>
            We will email a verification code after you set your password.
          </p>
          <div className={styles.stepper}>
            <span className={`${styles.step} ${styles.stepDone}`}>1 Email</span>
            <span className={`${styles.step} ${styles.stepActive}`}>2 Password</span>
            <span className={styles.step}>3 Verify</span>
          </div>
          <Link
            className={styles.textLink}
            href={`/auth/signup?email=${encodeURIComponent(resolvedEmail)}`}
          >
            Change email
          </Link>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelTitle}>Email signup</div>
          <p className={styles.muted}>Email address</p>
          <div className={styles.formStack}>
            <input className={styles.input} value={resolvedEmail} readOnly />
          </div>
          <form onSubmit={handleSignup} className={styles.formStack}>
            <label className={styles.label}>
              Password
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {password.length > 0 && (
              <div className={styles.hintList}>
                <span className={`${styles.hint} ${passwordRules.lengthOk ? styles.hintSuccess : styles.hintError}`}>
                  8–128 characters
                </span>
                <span className={`${styles.hint} ${passwordRules.hasLetter ? styles.hintSuccess : styles.hintError}`}>
                  At least one letter
                </span>
                <span className={`${styles.hint} ${passwordRules.hasNumber ? styles.hintSuccess : styles.hintError}`}>
                  At least one number
                </span>
              </div>
            )}
            {signupError && <div className={styles.error}>{signupError}</div>}
            {emailTaken && (
              <div className={styles.hint}>
                This email is already registered.
                <Link className={styles.textLink} href="/auth/login">
                  Sign in instead
                </Link>
              </div>
            )}
            <div className={styles.buttonRow}>
              <Link className={styles.textLink} href="/auth/signup">
                Back
              </Link>
              <button className={styles.button} type="submit" disabled={!passwordValid || submitting}>
                Send verification code
              </button>
            </div>
          </form>
          <div className={styles.linkRow}>
            Prefer OAuth?
            <Link className={styles.textLink} href="/auth/signup">
              Use Google or Apple
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
