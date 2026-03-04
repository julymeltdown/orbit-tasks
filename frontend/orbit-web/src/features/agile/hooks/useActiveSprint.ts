import { useEffect, useMemo, useState } from "react";

const PREFIX = "orbit.agile.active-sprint";

export interface ActiveSprintSnapshot {
  sprintId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  capacitySp: number;
  updatedAt: string;
}

function buildKey(workspaceId: string | null | undefined, projectId: string): string {
  return `${PREFIX}.${workspaceId ?? "workspace-default"}.${projectId}`;
}

function readSnapshot(key: string): ActiveSprintSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ActiveSprintSnapshot;
    if (!parsed || typeof parsed !== "object" || !parsed.sprintId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSnapshot(key: string, snapshot: ActiveSprintSnapshot | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!snapshot) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(snapshot));
}

export function useActiveSprint(workspaceId: string | null | undefined, projectId: string) {
  const storageKey = useMemo(() => buildKey(workspaceId, projectId), [workspaceId, projectId]);
  const [activeSprint, setActiveSprintState] = useState<ActiveSprintSnapshot | null>(() => readSnapshot(storageKey));

  useEffect(() => {
    setActiveSprintState(readSnapshot(storageKey));
  }, [storageKey]);

  function setActiveSprint(snapshot: ActiveSprintSnapshot | null) {
    setActiveSprintState(snapshot);
    writeSnapshot(storageKey, snapshot);
  }

  return {
    activeSprint,
    setActiveSprint
  };
}
