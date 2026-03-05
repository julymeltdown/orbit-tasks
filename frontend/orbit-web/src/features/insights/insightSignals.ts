import type { WorkItem } from "@/features/workitems/types";

export interface InsightSignals {
  remainingStoryPoints: number;
  availableCapacitySp: number;
  blockedCount: number;
  atRiskCount: number;
}

function toSp(minutes: number) {
  if (minutes <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(minutes / 60));
}

export function deriveInsightSignals(items: WorkItem[], sprintCapacitySp?: number | null): InsightSignals {
  const activeItems = items.filter((item) => item.status !== "ARCHIVED");
  const remainingItems = activeItems.filter((item) => item.status !== "DONE");
  const doneItems = activeItems.filter((item) => item.status === "DONE");

  const remainingEstimateMinutes = remainingItems.reduce((sum, item) => sum + (item.estimateMinutes ?? 0), 0);
  const doneEstimateMinutes = doneItems.reduce((sum, item) => sum + (item.estimateMinutes ?? 0), 0);

  const remainingStoryPointsFromEstimate = toSp(remainingEstimateMinutes);
  const remainingStoryPoints = remainingStoryPointsFromEstimate > 0 ? remainingStoryPointsFromEstimate : remainingItems.length;

  const blockedCount = remainingItems.filter((item) => (item.blockedReason ?? "").trim().length > 0).length;

  const now = Date.now();
  const overdueCount = remainingItems.filter((item) => {
    if (!item.dueAt) {
      return false;
    }
    const due = new Date(item.dueAt).getTime();
    return Number.isFinite(due) && due < now;
  }).length;
  const criticalInFlight = remainingItems.filter((item) => item.priority === "CRITICAL" || item.priority === "HIGH").length;
  const atRiskCount = Math.max(0, overdueCount + blockedCount + Math.ceil(criticalInFlight * 0.35));

  const uniqueAssignees = new Set(
    remainingItems
      .map((item) => item.assignee?.trim())
      .filter((assignee): assignee is string => Boolean(assignee))
  );
  const inferredTeamSize = Math.max(1, uniqueAssignees.size);
  const historicalThroughputSp = toSp(doneEstimateMinutes);
  const inferredCapacity = Math.max(inferredTeamSize * 6, Math.round((historicalThroughputSp + remainingStoryPoints) / 2));

  const availableCapacitySp = sprintCapacitySp && sprintCapacitySp > 0 ? Math.round(sprintCapacitySp) : inferredCapacity;

  return {
    remainingStoryPoints,
    availableCapacitySp,
    blockedCount,
    atRiskCount
  };
}
