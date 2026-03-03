"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "../auth.module.css";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthResponse, LinkedProvidersResponse } from "@/lib/types";

export default function AuthToolsPage() {
  const setSession = useAuthStore((state) => state.setSession);
  const setLinkedProviders = useAuthStore((state) => state.setLinkedProviders);

  const [refreshResult, setRefreshResult] = useState<AuthResponse | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const [callbackProvider, setCallbackProvider] = useState("google");
  const [callbackCode, setCallbackCode] = useState("");
  const [callbackState, setCallbackState] = useState("");
  const [callbackResult, setCallbackResult] = useState<AuthResponse | null>(null);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  const [linkProvider, setLinkProvider] = useState("google");
  const [linkCode, setLinkCode] = useState("");
  const [linkState, setLinkState] = useState("");
  const [linkResult, setLinkResult] = useState<LinkedProvidersResponse | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshError(null);
    setRefreshResult(null);
    try {
      const response = await authApi.refresh();
      setSession({
        userId: response.userId,
        accessToken: response.accessToken,
        expiresIn: response.expiresIn,
        linkedProviders: response.linkedProviders,
      });
      setRefreshResult(response);
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Refresh failed.");
    }
  };

  const handleCallback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCallbackError(null);
    setCallbackResult(null);
    try {
      const response = await authApi.oauthCallback(callbackProvider, callbackCode, callbackState);
      setSession({
        userId: response.userId,
        accessToken: response.accessToken,
        expiresIn: response.expiresIn,
        linkedProviders: response.linkedProviders,
      });
      setCallbackResult(response);
    } catch (error) {
      setCallbackError(error instanceof Error ? error.message : "Callback failed.");
    }
  };

  const handleLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLinkError(null);
    setLinkResult(null);
    try {
      const response = await authApi.oauthLink(linkProvider, {
        code: linkCode,
        state: linkState,
      });
      setLinkedProviders(response.providers);
      setLinkResult(response);
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Link failed.");
    }
  };

  const triggerAuthorize = (provider: string) => {
    window.location.href = authApi.oauthAuthorizeUrl(provider);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Auth tools</h1>
        <p>Developer utilities for refresh, OAuth callbacks, and provider linking.</p>
        <Link className={styles.textLink} href="/auth/login">
          Back to sign in
        </Link>
      </header>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <h2>Refresh token</h2>
          <p className={styles.copy}>Use the refresh endpoint to restore a session.</p>
          <div className={styles.actions}>
            <button className={styles.button} type="button" onClick={handleRefresh}>
              Refresh session
            </button>
          </div>
          {refreshError && <div className={styles.error}>{refreshError}</div>}
          {refreshResult && (
            <pre className={styles.output}>{JSON.stringify(refreshResult, null, 2)}</pre>
          )}
        </div>

        <div className={styles.panel}>
          <h2>OAuth callback</h2>
          <form onSubmit={handleCallback} className={styles.form}>
            <label className={styles.label}>
              Provider
              <select
                className={styles.input}
                value={callbackProvider}
                onChange={(event) => setCallbackProvider(event.target.value)}
              >
                <option value="google">google</option>
                <option value="apple">apple</option>
              </select>
            </label>
            <label className={styles.label}>
              Code
              <input
                className={styles.input}
                value={callbackCode}
                onChange={(event) => setCallbackCode(event.target.value)}
              />
            </label>
            <label className={styles.label}>
              State
              <input
                className={styles.input}
                value={callbackState}
                onChange={(event) => setCallbackState(event.target.value)}
              />
            </label>
            <button className={styles.button} type="submit">
              Submit callback
            </button>
          </form>
          {callbackError && <div className={styles.error}>{callbackError}</div>}
          {callbackResult && (
            <pre className={styles.output}>{JSON.stringify(callbackResult, null, 2)}</pre>
          )}
        </div>

        <div className={styles.panel}>
          <h2>Link provider</h2>
          <form onSubmit={handleLink} className={styles.form}>
            <label className={styles.label}>
              Provider
              <select
                className={styles.input}
                value={linkProvider}
                onChange={(event) => setLinkProvider(event.target.value)}
              >
                <option value="google">google</option>
                <option value="apple">apple</option>
              </select>
            </label>
            <label className={styles.label}>
              Code
              <input
                className={styles.input}
                value={linkCode}
                onChange={(event) => setLinkCode(event.target.value)}
              />
            </label>
            <label className={styles.label}>
              State
              <input
                className={styles.input}
                value={linkState}
                onChange={(event) => setLinkState(event.target.value)}
              />
            </label>
            <button className={styles.button} type="submit">
              Link provider
            </button>
          </form>
          {linkError && <div className={styles.error}>{linkError}</div>}
          {linkResult && <pre className={styles.output}>{JSON.stringify(linkResult, null, 2)}</pre>}
        </div>

        <div className={styles.panel}>
          <h2>OAuth authorize</h2>
          <p className={styles.copy}>Redirect to start the OAuth flow.</p>
          <div className={styles.actions}>
            <button
              className={styles.buttonSecondary}
              type="button"
              onClick={() => triggerAuthorize("google")}
            >
              Google authorize
            </button>
            <button
              className={styles.buttonSecondary}
              type="button"
              onClick={() => triggerAuthorize("apple")}
            >
              Apple authorize
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
