"use client";

import * as React from "react";

import { refreshSession } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

export function useRefreshToken() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const hasValidToken = useAuthStore((state) => state.hasValidToken);
  const attempted = React.useRef(false);

  React.useEffect(() => {
    if (!accessToken && !expiresAt && !attempted.current) {
      attempted.current = true;
      refreshSession();
      return;
    }
    if (!accessToken || !expiresAt) {
      return;
    }
    const refreshInMs = Math.max(expiresAt - Date.now() - 60_000, 0);
    const timer = window.setTimeout(() => {
      refreshSession();
    }, refreshInMs);
    return () => window.clearTimeout(timer);
  }, [accessToken, expiresAt]);

  React.useEffect(() => {
    const handleFocus = () => {
      if (!hasValidToken()) {
        refreshSession();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [hasValidToken]);
}
