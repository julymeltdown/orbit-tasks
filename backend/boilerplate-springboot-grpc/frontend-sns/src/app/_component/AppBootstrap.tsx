"use client";

import { useRefreshToken } from "@/hooks/useRefreshToken";

export default function AppBootstrap() {
  useRefreshToken();
  return null;
}
