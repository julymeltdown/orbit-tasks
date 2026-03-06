import type { AIGuidanceStatus } from "@/features/insights/aiGuidanceStatus";

export interface AIPresentationTone {
  badge: string;
  tone: "neutral" | "positive" | "warning";
}

export function getAIPresentationTone(status: AIGuidanceStatus): AIPresentationTone {
  if (status.state === "fallback") {
    return { badge: "Fallback", tone: "warning" };
  }
  if (status.state === "evaluated") {
    return { badge: "Draft Ready", tone: "positive" };
  }
  return { badge: "Not Ready", tone: "neutral" };
}
