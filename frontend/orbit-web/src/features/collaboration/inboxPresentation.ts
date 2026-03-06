export type InboxFilter = "all" | "needs_action" | "mentions" | "ai_questions" | "resolved";
export type InboxUrgency = "LOW" | "MEDIUM" | "HIGH";

export interface InboxItemView {
  inboxItemId: string;
  userId: string;
  kind: "NOTIFICATION" | "REQUEST" | "MENTION" | "AI_QUESTION" | string;
  sourceType: string;
  sourceId: string;
  messageId: string;
  read: boolean;
  status: "OPEN" | "READ" | "RESOLVED" | string;
  createdAt: string;
  resolvedAt: string | null;
  preview: string;
  sourceSummary: string;
  urgency: InboxUrgency | string;
  nextActionLabel: string;
  sourcePath: string;
  threadTitle: string | null;
}

export interface ThreadContextView {
  threadId: string;
  workspaceId: string;
  workItemId: string;
  workItemTitle: string;
  title: string;
  createdBy: string;
  status: string;
  createdAt: string;
  sourceSummary: string;
  sourcePath: string;
  messageCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  resolutionHint: string;
}

const FILTER_LABELS: Record<InboxFilter, string> = {
  all: "전체",
  needs_action: "조치 필요",
  mentions: "멘션",
  ai_questions: "AI 질문",
  resolved: "처리 완료"
};

const URGENCY_LABELS: Record<string, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "긴급"
};

const KIND_LABELS: Record<string, string> = {
  NOTIFICATION: "업데이트",
  REQUEST: "요청",
  MENTION: "멘션",
  AI_QUESTION: "AI 질문"
};

export function getInboxFilterLabel(value: InboxFilter): string {
  return FILTER_LABELS[value];
}

export function resolveInboxBucket(item: InboxItemView): InboxFilter[] {
  const buckets: InboxFilter[] = ["all"];
  if (item.status === "RESOLVED") {
    buckets.push("resolved");
    return buckets;
  }
  if (item.kind === "MENTION") {
    buckets.push("mentions");
  }
  if (item.kind === "AI_QUESTION") {
    buckets.push("ai_questions");
  }
  if (!item.read || item.status === "OPEN" || item.urgency === "HIGH") {
    buckets.push("needs_action");
  }
  return buckets;
}

export function resolveInboxKindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

export function resolveInboxUrgencyLabel(urgency: string): string {
  return URGENCY_LABELS[urgency] ?? urgency;
}

export function sortInboxItems(items: InboxItemView[]): InboxItemView[] {
  return [...items].sort((left, right) => {
    const urgencyScore = scoreUrgency(right.urgency) - scoreUrgency(left.urgency);
    if (urgencyScore !== 0) {
      return urgencyScore;
    }
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function scoreUrgency(urgency: string): number {
  if (urgency === "HIGH") return 3;
  if (urgency === "MEDIUM") return 2;
  return 1;
}

export function formatInboxRelativeTime(value: string): string {
  const now = Date.now();
  const target = new Date(value).getTime();
  const diffMs = target - now;
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

export function filterInboxItems(items: InboxItemView[], filter: InboxFilter): InboxItemView[] {
  if (filter === "all") {
    return items;
  }
  return items.filter((item) => resolveInboxBucket(item).includes(filter));
}
