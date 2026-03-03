"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { alertForError } from "@/lib/errorMapper";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace("/home");
    }
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get("email");
    if (email) {
      setLoginEmail(email);
    }
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    try {
      const response = await authApi.login({
        email: loginEmail,
        password: loginPassword,
      });
      setSession({
        userId: response.userId,
        accessToken: response.accessToken,
        expiresIn: response.expiresIn,
        linkedProviders: response.linkedProviders,
      });
      router.replace("/home");
    } catch (error) {
      const message = alertForError(error);
      setLoginError(message);
    }
  };

  const triggerAuthorize = (provider: string) => {
    window.location.href = authApi.oauthAuthorizeUrl(provider);
  };

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.heroBadge}>Sign in</span>
          <h1 className={styles.heroTitle}>Welcome back.</h1>
          <p className={styles.heroCopy}>Use email or OAuth to continue.</p>
          <Link className={styles.textLink} href="/auth/signup">
            Need an account? Create one
          </Link>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelTitle}>Email login</div>
          <form onSubmit={handleLogin} className={styles.formStack}>
            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
            </label>
            <label className={styles.label}>
              Password
              <input
                className={styles.input}
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
              />
            </label>
            {loginError && <div className={styles.error}>{loginError}</div>}
            <button className={styles.button} type="submit">
              Sign in
            </button>
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
            Need help?
            <Link className={styles.textLink} href="/auth/tools">
              Open auth tools
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
