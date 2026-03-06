import type { ProjectViewType, ScopeNavSection } from "@/app/navigationModel";

export const ROLE_LABELS: Record<string, string> = {
  WORKSPACE_MEMBER: "멤버",
  WORKSPACE_MANAGER: "매니저",
  WORKSPACE_ADMIN: "관리자"
};

export const SCOPE_LABELS: Record<ScopeNavSection, string> = {
  "my-work": "홈",
  sprint: "스프린트",
  inbox: "인박스",
  workspaces: "워크스페이스",
  portfolio: "포트폴리오",
  insights: "인사이트",
  integrations: "연동",
  admin: "관리"
};

export const PROJECT_VIEW_LABELS: Record<ProjectViewType, string> = {
  board: "보드",
  table: "테이블",
  timeline: "타임라인",
  calendar: "캘린더",
  dashboard: "대시보드"
};

export const SEARCH_PLACEHOLDERS = {
  default: "작업, 스레드, 화면 검색",
  board: "작업 제목, 담당자, 마감일 검색",
  sprint: "스프린트 목표, backlog, DSU 검색",
  inbox: "알림, 요청, 멘션 검색",
  insights: "리스크, 평가, 추천 액션 검색"
} as const;

export const ACTION_LABELS = {
  continueWorkspace: "이 워크스페이스로 계속",
  goToBoard: "보드 열기",
  goToSprint: "스프린트 열기",
  goToInbox: "인박스 열기",
  goToInsights: "인사이트 열기",
  createFirstTask: "첫 작업 만들기",
  importTasks: "작업 가져오기",
  inviteTeammate: "팀원 초대",
  continueRequestedPage: "요청한 화면으로 계속",
  enrichProfileLater: "나중에 프로필 보완"
} as const;

export const EMPTY_STATE_COPY = {
  learnMore: "자세히 보기",
  noData: "아직 데이터가 없습니다.",
  blocked: "지금은 이 작업을 진행할 수 없습니다.",
  fallback: "규칙 기반 결과를 표시하고 있습니다."
} as const;

export function roleLabel(role: string | null | undefined) {
  if (!role) {
    return "역할 없음";
  }
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}
