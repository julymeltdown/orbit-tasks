import { request } from "@/lib/http/client";

export interface DsuReminder {
  workspaceId: string;
  projectId: string;
  sprintId: string | null;
  authorId: string;
  pending: boolean;
  severity: "INFO" | "WARNING";
  title: string;
  message: string;
  actionPath: string;
  dueDate: string | null;
  latestSubmittedAt: string | null;
}

export async function fetchDsuReminder(workspaceId: string, projectId: string, authorId: string) {
  const query = new URLSearchParams({
    workspaceId,
    projectId,
    authorId
  });
  return request<DsuReminder>(`/api/v2/dsu/reminders?${query.toString()}`);
}
