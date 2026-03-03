"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";
import { useAuthStore } from "@/store/authStore";

export default function AuthLandingPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace("/home");
    }
  }, [hydrated, accessToken, router]);

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.heroBadge}>Boilerplate SNS</span>
          <h1 className={styles.heroTitle}>Join the gateway-powered network.</h1>
          <p className={styles.heroCopy}>
            Create an account, verify your email, and start posting right away.
          </p>
          <div className={styles.heroCard}>
            <h3>What you get</h3>
            <ul className={styles.heroList}>
              <li>Email signup with verification code.</li>
              <li>OAuth onboarding with Google or Apple.</li>
              <li>One login shared across every microservice.</li>
            </ul>
          </div>
          <Link className={styles.textLink} href="/auth/tools">
            Need OAuth callbacks or refresh testing?
          </Link>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelTitle}>Get started</div>
          <p className={styles.muted}>Choose how you want to access the SNS.</p>
          <div className={styles.formStack}>
            <Link className={styles.button} href="/auth/signup">
              Create account
            </Link>
            <Link className={styles.buttonSecondary} href="/auth/login">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
