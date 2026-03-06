import type { WorkItem } from "@/features/workitems/types";
import type { ProjectViewFilters } from "@/stores/projectViewStore";

export type DrilldownMetric =
  | "all"
  | "done"
  | "review"
  | "overdue"
  | "blocked"
  | "atRisk";

export function isBlockedItem(item: WorkItem) {
  return Boolean(item.blockedReason && item.status !== "DONE" && item.status !== "ARCHIVED");
}

export function isOverdueItem(item: WorkItem) {
  if (!item.dueAt || item.status === "DONE" || item.status === "ARCHIVED") {
    return false;
  }
  return new Date(item.dueAt).getTime() < Date.now();
}

export function isAtRiskItem(item: WorkItem) {
  if (item.status === "DONE" || item.status === "ARCHIVED") {
    return false;
  }
  return isBlockedItem(item) || isOverdueItem(item) || item.priority === "CRITICAL";
}

export function matchesDrilldownMetric(metric: DrilldownMetric | null, item: WorkItem) {
  switch (metric) {
    case "done":
      return item.status === "DONE";
    case "review":
      return item.status === "REVIEW";
    case "overdue":
      return isOverdueItem(item);
    case "blocked":
      return isBlockedItem(item);
    case "atRisk":
      return isAtRiskItem(item);
    case "all":
    case null:
    default:
      return true;
  }
}

export function getDrilldownLabel(metric: DrilldownMetric | null) {
  switch (metric) {
    case "done":
      return "완료된 작업만";
    case "review":
      return "Review 상태 작업만";
    case "overdue":
      return "기한이 지난 작업만";
    case "blocked":
      return "블로커가 있는 작업만";
    case "atRisk":
      return "위험 신호가 있는 작업만";
    case "all":
    case null:
    default:
      return "현재 필터 기준 전체 작업";
  }
}

export function resetFiltersForDrilldown(): Partial<ProjectViewFilters> {
  return {
    status: "ALL",
    query: ""
  };
}
