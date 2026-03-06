import type { SprintView } from "@/features/agile/hooks/useSprintPlanning";

export type SprintMode = "planning" | "dsu";

export interface SprintModeSummary {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
}

export function getSprintModeSummary(mode: SprintMode, sprint: SprintView | null, backlogCount: number, dayPlanCount: number): SprintModeSummary {
  if (mode === "planning") {
    return {
      eyebrow: "Planning Mode",
      title: sprint ? "이번 스프린트 계획을 정리하세요" : "먼저 스프린트를 설정하세요",
      description: sprint
        ? `현재 backlog ${backlogCount}개, day plan ${dayPlanCount}일 분량을 기준으로 실행 전 계획을 마무리합니다.`
        : "기간, 목표, 용량을 정하고 backlog를 선택한 다음 AI day plan draft를 생성합니다.",
      nextStep: sprint?.freezeState ? "계획이 이미 확정되었습니다. 이제 DSU Review에서 실행 결과를 검토하세요." : "backlog와 day plan을 검토한 뒤 freeze 하면 DSU Review가 열립니다."
    };
  }

  return {
    eyebrow: "DSU Review Mode",
    title: sprint?.freezeState ? "오늘의 실행 결과를 리뷰하세요" : "계획 freeze 후 DSU 리뷰가 열립니다",
    description: sprint?.freezeState
      ? "DSU를 입력하면 AI가 변경 후보를 draft로 제안하고, 승인한 항목만 실제 작업에 반영됩니다."
      : "DSU는 계획이 고정된 뒤에만 의미가 있습니다. 먼저 Planning mode에서 sprint plan을 확정하세요.",
    nextStep: sprint?.freezeState ? "어제/오늘/블로커를 입력하고 승인할 제안만 선택하세요." : "Planning mode에서 sprint info → backlog → day plan 순서로 진행하세요."
  };
}

export function getSprintReadinessLabel(sprint: SprintView | null, backlogCount: number, dayPlanCount: number) {
  if (!sprint) {
    return "스프린트 없음";
  }
  if (sprint.freezeState) {
    return "계획 확정 완료";
  }
  if (dayPlanCount > 0) {
    return "day plan 검토 중";
  }
  if (backlogCount > 0) {
    return "backlog 구성 완료";
  }
  return "기본 정보 입력 완료";
}

export function getDsuLockReason(sprint: SprintView | null) {
  if (!sprint) {
    return "활성 스프린트가 없습니다. Planning mode에서 스프린트를 먼저 만드세요.";
  }
  if (!sprint.freezeState) {
    return "계획이 아직 Draft 상태입니다. day plan을 freeze 하면 DSU Review가 열립니다.";
  }
  return null;
}
