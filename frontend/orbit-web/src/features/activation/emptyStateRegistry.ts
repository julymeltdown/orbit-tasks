import type { ActivationActionLink } from "@/features/activation/types";

export type GuidedEmptyStateScope = "BOARD" | "SPRINT" | "INSIGHTS" | "INBOX" | "WORKSPACE_SELECT" | "DASHBOARD";

export interface GuidedEmptyState {
  scope: GuidedEmptyStateScope;
  title: string;
  description: string;
  statusHint?: string;
  primaryAction: ActivationActionLink;
  secondaryActions?: ActivationActionLink[];
  learnMoreLink?: string;
}

const EMPTY_STATE_REGISTRY: Record<GuidedEmptyStateScope, GuidedEmptyState> = {
  BOARD: {
    scope: "BOARD",
    title: "아직 작업이 없습니다",
    description: "첫 작업을 만들면 보드, 테이블, 타임라인, 캘린더가 같은 데이터로 바로 연결됩니다.",
    statusHint: "첫 행동",
    primaryAction: { label: "첫 작업 만들기", path: "/app/projects/board?create=1" },
    secondaryActions: [
      { label: "작업 가져오기", path: "/app/integrations/import" },
      { label: "스프린트 열기", path: "/app/sprint?mode=planning" }
    ]
  },
  SPRINT: {
    scope: "SPRINT",
    title: "활성 스프린트가 없습니다",
    description: "스프린트를 시작해야 데일리 플랜, DSU, 일정 코칭이 한 루프로 연결됩니다.",
    statusHint: "계획 → 동결 → 실행",
    primaryAction: { label: "스프린트 만들기", path: "/app/sprint?mode=planning" },
    secondaryActions: [
      { label: "보드로 돌아가기", path: "/app/projects/board" }
    ]
  },
  INSIGHTS: {
    scope: "INSIGHTS",
    title: "아직 평가가 없습니다",
    description: "평가를 실행하면 리스크, 신뢰도, 대응 Draft가 함께 생성됩니다.",
    statusHint: "AI 진단",
    primaryAction: { label: "평가 실행", path: "/app/insights#run" },
    secondaryActions: [{ label: "보드 검토", path: "/app/projects/board" }]
  },
  INBOX: {
    scope: "INBOX",
    title: "인박스가 비어 있습니다",
    description: "처리할 알림과 AI 질문이 없습니다. 실행 흐름으로 돌아가거나 스프린트를 검토하세요.",
    statusHint: "triage 완료",
    primaryAction: { label: "보드 열기", path: "/app/projects/board" },
    secondaryActions: [{ label: "스프린트 열기", path: "/app/sprint?mode=planning" }]
  },
  WORKSPACE_SELECT: {
    scope: "WORKSPACE_SELECT",
    title: "워크스페이스를 선택하세요",
    description: "워크스페이스를 고르면 최근 프로젝트 맥락을 복원하고 바로 이어서 작업할 수 있습니다.",
    primaryAction: { label: "기본 워크스페이스 사용", path: "/app/projects/board" }
  },
  DASHBOARD: {
    scope: "DASHBOARD",
    title: "대시보드에 표시할 활동이 필요합니다",
    description: "작업을 만들거나 이동하면 진행률, 용량, 블로커, 리스크 위젯이 채워집니다.",
    primaryAction: { label: "보드 열기", path: "/app/projects/board" }
  }
};

export function getGuidedEmptyState(scope: GuidedEmptyStateScope) {
  return EMPTY_STATE_REGISTRY[scope];
}
