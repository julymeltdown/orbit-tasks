"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthState = {
  userId?: string;
  accessToken?: string;
  expiresAt?: number;
  linkedProviders: string[];
  hydrated: boolean;
  setSession: (payload: {
    userId: string;
    accessToken: string;
    expiresIn: number;
    linkedProviders?: string[];
  }) => void;
  clearSession: () => void;
  hasValidToken: () => boolean;
  setHydrated: (value: boolean) => void;
  setLinkedProviders: (providers: string[]) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: undefined,
      accessToken: undefined,
      expiresAt: undefined,
      linkedProviders: [],
      hydrated: false,
      setSession: ({ userId, accessToken, expiresIn, linkedProviders }) => {
        set({
          userId,
          accessToken,
          expiresAt: Date.now() + expiresIn * 1000,
          linkedProviders: linkedProviders ?? [],
        });
      },
      clearSession: () =>
        set({
          userId: undefined,
          accessToken: undefined,
          expiresAt: undefined,
          linkedProviders: [],
        }),
      hasValidToken: () => {
        const { accessToken, expiresAt } = get();
        if (!accessToken || !expiresAt) {
          return false;
        }
        return Date.now() < expiresAt - 30_000;
      },
      setHydrated: (value) => set({ hydrated: value }),
      setLinkedProviders: (providers) => set({ linkedProviders: providers }),
    }),
    {
      name: "auth-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        userId: state.userId,
        accessToken: state.accessToken,
        expiresAt: state.expiresAt,
        linkedProviders: state.linkedProviders,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
