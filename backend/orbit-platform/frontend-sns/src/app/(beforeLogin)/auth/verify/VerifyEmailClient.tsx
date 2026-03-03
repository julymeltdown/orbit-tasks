"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { alertForError } from "@/lib/errorMapper";

type VerifyEmailClientProps = {
  initialEmail?: string;
};

export default function VerifyEmailClient({ initialEmail = "" }: VerifyEmailClientProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [resolvedEmail, setResolvedEmail] = useState(initialEmail);
  const [emailReady, setEmailReady] = useState(false);
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const emailValid = useMemo(() => {
    if (!resolvedEmail) {
      return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail);
  }, [resolvedEmail]);

  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace("/home");
    }
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    if (initialEmail) {
      setResolvedEmail(initialEmail);
      sessionStorage.setItem("signupEmail", initialEmail);
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
  }, [initialEmail]);

  useEffect(() => {
    if (emailReady && !resolvedEmail) {
      router.replace("/auth/signup");
    }
  }, [emailReady, resolvedEmail, router]);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVerifyError(null);
    if (!resolvedEmail) {
      setVerifyError("Email is required.");
      return;
    }
    setVerifying(true);
    try {
      await authApi.verify({
        email: resolvedEmail,
        code,
      });
      sessionStorage.removeItem("signupEmail");
      window.alert("Email verified. Please sign in to continue.");
      router.replace(`/auth/login?email=${encodeURIComponent(resolvedEmail)}`);
    } catch (error) {
      const message = alertForError(error);
      setVerifyError(message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.heroBadge}>Verify email</span>
          <h1 className={styles.heroTitle}>Confirm your address.</h1>
          <p className={styles.heroCopy}>
            Enter the verification code we sent to your inbox.
          </p>
          <div className={styles.stepper}>
            <span className={`${styles.step} ${styles.stepDone}`}>1 Email</span>
            <span className={`${styles.step} ${styles.stepDone}`}>2 Password</span>
            <span className={`${styles.step} ${styles.stepActive}`}>3 Verify</span>
          </div>
          <Link className={styles.textLink} href="/auth/signup">
            Start over
          </Link>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelTitle}>Email verification</div>
          <form onSubmit={handleVerify} className={styles.formStack}>
            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                type="email"
                value={resolvedEmail}
                readOnly
              />
            </label>
            <label className={styles.label}>
              Verification code
              <input
                className={styles.input}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </label>
            {!emailValid && resolvedEmail.length > 0 && (
              <div className={`${styles.hint} ${styles.hintError}`}>
                Enter a valid email address.
              </div>
            )}
            {verifyError && <div className={styles.error}>{verifyError}</div>}
            <div className={styles.buttonRow}>
              <Link className={styles.textLink} href="/auth/login">
                Back to sign in
              </Link>
              <button
                className={styles.button}
                type="submit"
                disabled={!emailValid || code.trim().length === 0 || verifying}
              >
                {verifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
