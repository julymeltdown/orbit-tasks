"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OnboardingState = {
  username: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  setField: (field: "username" | "nickname" | "avatarUrl" | "bio", value: string) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      username: "",
      nickname: "",
      avatarUrl: "",
      bio: "",
      setField: (field, value) =>
        set((state) => ({ ...state, [field]: value } as OnboardingState)),
      reset: () => set({ username: "", nickname: "", avatarUrl: "", bio: "" }),
    }),
    {
      name: "onboarding-profile",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
