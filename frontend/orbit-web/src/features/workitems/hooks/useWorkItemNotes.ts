import { useCallback, useEffect, useMemo, useState } from "react";

function buildStorageKey(workspaceId: string, projectId: string): string {
  return `orbit.workitems.notes.${workspaceId}.${projectId}`;
}

function readMap(key: string): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = localStorage.getItem(key);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const [itemKey, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        next[itemKey] = value;
      }
    }
    return next;
  } catch {
    return {};
  }
}

function writeMap(key: string, map: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(key, JSON.stringify(map));
}

export function useWorkItemNotes(workspaceId: string | null | undefined, projectId: string) {
  const storageKey = useMemo(() => {
    return buildStorageKey(workspaceId ?? "workspace-default", projectId);
  }, [workspaceId, projectId]);

  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setNotes(readMap(storageKey));
  }, [storageKey]);

  const getNote = useCallback(
    (workItemId: string) => {
      return notes[workItemId] ?? "";
    },
    [notes]
  );

  const setNote = useCallback(
    (workItemId: string, markdown: string) => {
      setNotes((previous) => {
        const next = { ...previous, [workItemId]: markdown };
        writeMap(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  return {
    notes,
    getNote,
    setNote
  };
}
