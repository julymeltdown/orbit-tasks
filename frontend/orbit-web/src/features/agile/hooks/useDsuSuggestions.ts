import { request } from "@/lib/http/client";
import type { DSUSuggestion } from "@/features/workitems/types";

export interface DsuEntry {
  dsuId: string;
  workspaceId: string;
  projectId: string;
  sprintId: string;
  authorId: string;
  rawText: string;
  createdAt: string;
}

export interface DsuApplyItem {
  suggestionId: string;
  approved: boolean;
  overrideChange?: Record<string, unknown>;
}

export interface DsuApplyResponse {
  dsuId: string;
  appliedCount: number;
  skippedCount: number;
  status: string;
}

interface CreateDsuInput {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  authorId: string;
  rawText: string;
}

export function useDsuSuggestions() {
  async function createDsu(input: CreateDsuInput) {
    return request<DsuEntry>("/api/v2/dsu", {
      method: "POST",
      body: input
    });
  }

  async function suggest(dsuId: string) {
    return request<DSUSuggestion[]>(`/api/v2/dsu/${dsuId}:suggest`, {
      method: "POST",
      body: { mode: "DEFAULT" }
    });
  }

  async function apply(dsuId: string, actorId: string, suggestions: DsuApplyItem[]) {
    return request<DsuApplyResponse>(`/api/v2/dsu/${dsuId}:apply`, {
      method: "POST",
      body: {
        actorId,
        suggestions
      }
    });
  }

  return {
    createDsu,
    suggest,
    apply
  };
}
