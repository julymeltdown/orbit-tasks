import { useCallback, useEffect, useMemo, useState } from "react";
import { request } from "@/lib/http/client";
import {
  type DependencyEdge,
  type DependencyGraph,
  type WorkItem,
  type WorkItemActivity,
  type WorkItemPriority,
  type WorkItemStatus,
  type WorkItemType
} from "@/features/workitems/types";

interface CreateInput {
  projectId: string;
  type: WorkItemType;
  title: string;
  assignee?: string;
  startAt?: string;
  dueAt?: string;
  priority?: WorkItemPriority;
  estimateMinutes?: number;
  actualMinutes?: number;
  blockedReason?: string;
  markdownBody?: string;
}

interface DependencyInput {
  toWorkItemId: string;
  type?: string;
}

interface PatchInput {
  type?: WorkItemType;
  title?: string;
  status?: WorkItemStatus;
  assignee?: string | null;
  startAt?: string | null;
  dueAt?: string | null;
  priority?: WorkItemPriority | null;
  estimateMinutes?: number | null;
  actualMinutes?: number | null;
  blockedReason?: string | null;
  markdownBody?: string | null;
}

interface MutationState {
  loading: boolean;
  error: string | null;
}

const EMPTY_MUTATION: MutationState = { loading: false, error: null };

export function useWorkItems(projectId: string) {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [dependencyGraph, setDependencyGraph] = useState<DependencyGraph>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutation, setMutation] = useState<MutationState>(EMPTY_MUTATION);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<WorkItem[]>(`/api/v2/work-items?projectId=${encodeURIComponent(projectId)}`);
      setItems(response);
      const graph = await request<DependencyGraph>(`/api/v2/work-items/dependency-graph?projectId=${encodeURIComponent(projectId)}`);
      setDependencyGraph(graph);
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
      const created = await request<WorkItem>("/api/v2/work-items", {
        method: "POST",
        body: {
          projectId: input.projectId,
          type: input.type,
          title: input.title,
          assignee: input.assignee ?? "",
          startAt: input.startAt ?? "",
          dueAt: input.dueAt ?? "",
          priority: input.priority ?? "MEDIUM",
          estimateMinutes: input.estimateMinutes ?? null,
          actualMinutes: input.actualMinutes ?? null,
          blockedReason: input.blockedReason ?? null,
          markdownBody: input.markdownBody ?? null
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
      const updated = await request<WorkItem>(`/api/v2/work-items/${workItemId}/status`, {
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

  async function updateItem(workItemId: string, patch: PatchInput) {
    const previous = items;
    const optimistic = previous.map((item) =>
      item.workItemId === workItemId
        ? {
            ...item,
            type: patch.type ?? item.type,
            title: patch.title ?? item.title,
            status: patch.status ?? item.status,
            assignee: patch.assignee === undefined ? item.assignee : patch.assignee,
            startAt: patch.startAt === undefined ? item.startAt : patch.startAt,
            dueAt: patch.dueAt === undefined ? item.dueAt : patch.dueAt,
            priority: patch.priority === undefined ? item.priority : patch.priority,
            estimateMinutes: patch.estimateMinutes === undefined ? item.estimateMinutes : patch.estimateMinutes,
            actualMinutes: patch.actualMinutes === undefined ? item.actualMinutes : patch.actualMinutes,
            blockedReason: patch.blockedReason === undefined ? item.blockedReason : patch.blockedReason,
            markdownBody: patch.markdownBody === undefined ? item.markdownBody : patch.markdownBody
          }
        : item
    );
    setItems(optimistic);

    try {
      const updated = await request<WorkItem>(`/api/v2/work-items/${workItemId}`, {
        method: "PATCH",
        body: patch
      });
      setItems((current) => current.map((item) => (item.workItemId === workItemId ? updated : item)));
      return updated;
    } catch (e) {
      setItems(previous);
      setMutation({ loading: false, error: e instanceof Error ? e.message : "Failed to update work item" });
      throw e;
    }
  }

  async function addDependency(workItemId: string, input: DependencyInput) {
    const result = await request<DependencyEdge>(`/api/v2/work-items/${workItemId}/dependencies`, {
      method: "POST",
      body: {
        toWorkItemId: input.toWorkItemId,
        type: input.type ?? "FS"
      }
    });
    await load();
    return result;
  }

  async function removeDependency(dependencyId: string) {
    await request<void>(`/api/v2/dependencies/${dependencyId}`, {
      method: "DELETE"
    });
    await load();
  }

  async function loadActivity(workItemId: string) {
    return request<WorkItemActivity[]>(`/api/v2/work-items/${workItemId}/activity`);
  }

  async function archiveItem(workItemId: string) {
    return updateStatus(workItemId, "ARCHIVED");
  }

  return {
    items,
    dependencyGraph,
    byStatus,
    loading,
    error,
    mutation,
    load,
    createItem,
    updateStatus,
    updateItem,
    addDependency,
    removeDependency,
    loadActivity,
    archiveItem
  };
}

export type {
  DependencyEdge,
  DependencyGraph,
  WorkItem,
  WorkItemActivity,
  WorkItemPriority,
  WorkItemStatus,
  WorkItemType
};
