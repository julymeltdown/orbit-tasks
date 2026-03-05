import { useCallback, useMemo } from "react";
import { HttpError, request } from "@/lib/http/client";
import type { ActivationAcceptedResponse, ActivationEvent, ActivationState } from "@/features/activation/types";

function buildStateQuery(workspaceId: string, projectId: string, userId: string) {
  const query = new URLSearchParams({
    workspaceId,
    projectId,
    userId
  });
  return query.toString();
}

export function useActivation() {
  const getState = useCallback(async (workspaceId: string, projectId: string, userId: string) => {
    try {
      return await request<ActivationState>(`/api/v2/activation/state?${buildStateQuery(workspaceId, projectId, userId)}`);
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }, []);

  const recordEvent = useCallback(async (event: ActivationEvent) => {
    return request<ActivationAcceptedResponse>("/api/v2/activation/events", {
      method: "POST",
      body: event
    });
  }, []);

  return useMemo(
    () => ({
      getState,
      recordEvent
    }),
    [getState, recordEvent]
  );
}
