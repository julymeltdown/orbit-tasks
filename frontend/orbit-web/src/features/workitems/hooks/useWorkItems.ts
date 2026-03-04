import { useCallback, useEffect, useMemo, useState } from "react";
import { request } from "@/lib/http/client";

export type WorkItemStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "ARCHIVED";
export type WorkItemType = "TASK" | "STORY" | "BUG" | "EPIC";
export type WorkItemPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface WorkItem {
  workItemId: string;
  projectId: string;
  type: string;
  title: string;
  status: WorkItemStatus;
  assignee: string | null;
  startAt: string | null;
  dueAt: string | null;
  priority: string | null;
  createdAt: string;
}

interface CreateInput {
  projectId: string;
  type: WorkItemType;
  title: string;
  assignee?: string;
  startAt?: string;
  dueAt?: string;
  priority?: WorkItemPriority;
}

interface DependencyInput {
  toWorkItemId: string;
  type?: string;
}

interface MutationState {
  loading: boolean;
  error: string | null;
}

const EMPTY_MUTATION: MutationState = { loading: false, error: null };

export function useWorkItems(projectId: string) {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutation, setMutation] = useState<MutationState>(EMPTY_MUTATION);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<WorkItem[]>("/api/work-items");
      setItems(response.filter((item) => item.projectId === projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load work items");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const byStatus = useMemo(() => {
    const grouped: Record<WorkItemStatus, WorkItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
      ARCHIVED: []
    };
    for (const item of items) {
      const status = grouped[item.status] ? item.status : "TODO";
      grouped[status].push(item);
    }
    return grouped;
  }, [items]);

  async function createItem(input: CreateInput) {
    setMutation({ loading: true, error: null });
    try {
      const created = await request<WorkItem>("/api/work-items", {
        method: "POST",
        body: {
          projectId: input.projectId,
          type: input.type,
          title: input.title,
          assignee: input.assignee ?? "",
          startAt: input.startAt ?? "",
          dueAt: input.dueAt ?? "",
          priority: input.priority ?? "MEDIUM"
        }
      });
      setItems((prev) => [created, ...prev]);
      setMutation(EMPTY_MUTATION);
      return created;
    } catch (e) {
      const nextError = e instanceof Error ? e.message : "Failed to create work item";
      setMutation({ loading: false, error: nextError });
      throw e;
    }
  }

  async function updateStatus(workItemId: string, status: WorkItemStatus) {
    const previous = items;
    setItems((prev) => prev.map((item) => (item.workItemId === workItemId ? { ...item, status } : item)));
    try {
      const updated = await request<WorkItem>(`/api/work-items/${workItemId}`, {
        method: "PATCH",
        body: { status }
      });
      setItems((prev) => prev.map((item) => (item.workItemId === workItemId ? updated : item)));
      return updated;
    } catch (e) {
      setItems(previous);
      setMutation({ loading: false, error: e instanceof Error ? e.message : "Failed to update status" });
      throw e;
    }
  }

  async function addDependency(workItemId: string, input: DependencyInput) {
    return request(`/api/work-items/${workItemId}/dependencies`, {
      method: "POST",
      body: {
        toWorkItemId: input.toWorkItemId,
        type: input.type ?? "FS"
      }
    });
  }

  async function archiveItem(workItemId: string) {
    return updateStatus(workItemId, "ARCHIVED");
  }

  return {
    items,
    byStatus,
    loading,
    error,
    mutation,
    load,
    createItem,
    updateStatus,
    addDependency,
    archiveItem
  };
}
