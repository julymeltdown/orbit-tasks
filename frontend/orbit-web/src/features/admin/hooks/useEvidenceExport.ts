import { request } from "@/lib/http/client";

interface AuditEvent {
  eventId: string;
  workspaceId: string;
  actor: string;
  action: string;
  target: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export function useEvidenceExport(workspaceId: string) {
  async function exportAuditJsonl(): Promise<string> {
    const events = await request<AuditEvent[]>(
      `/api/admin/governance/audit-events?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    return events.map((event) => JSON.stringify(event)).join("\n");
  }

  return { exportAuditJsonl };
}
