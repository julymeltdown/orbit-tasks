import { create } from "zustand";
import { request } from "@/lib/http/client";

export type Presence = "online" | "focus" | "offline";

export interface ProfileSettings {
  userId: string;
  timezone: string;
  locale: string;
  presence: Presence;
  notificationPreference: string;
  mentionPush: boolean;
  threadPush: boolean;
  digestEnabled: boolean;
  updatedAt: string;
}

interface ProfileState {
  settings: ProfileSettings | null;
  isLoading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  saveSettings: (partial: Omit<ProfileSettings, "userId" | "updatedAt">) => Promise<void>;
}

function normalizePresence(raw: string): Presence {
  if (raw === "focus") {
    return "focus";
  }
  if (raw === "offline") {
    return "offline";
  }
  return "online";
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await request<ProfileSettings>("/api/profile/settings");
      set({
        settings: {
          ...result,
          presence: normalizePresence(result.presence)
        },
        isLoading: false
      });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : "Failed to load profile settings" });
    }
  },

  saveSettings: async (partial) => {
    const current = get().settings;
    if (!current) {
      throw new Error("Profile settings are not loaded");
    }

    set({ isLoading: true, error: null });
    try {
      const result = await request<ProfileSettings>("/api/profile/settings", {
        method: "PATCH",
        body: partial
      });
      set({
        settings: {
          ...result,
          presence: normalizePresence(result.presence)
        },
        isLoading: false
      });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : "Failed to update profile settings" });
    }
  }
}));
