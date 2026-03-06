import type { SurfacePurpose } from "@/features/usability";
import { ACTION_LABELS, SEARCH_PLACEHOLDERS } from "@/features/usability";

const ROUTE_PURPOSES: Array<{ match: (pathname: string) => boolean; purpose: SurfacePurpose }> = [
  {
    match: (pathname) => pathname === "/app",
    purpose: {
      kicker: "오늘 바로 시작",
      title: "작업 흐름 시작",
      description: "첫 작업을 만들거나 이어서 해야 할 일을 바로 확인하세요.",
      primaryAction: { label: ACTION_LABELS.createFirstTask, path: "/app/projects/board?create=1" },
      searchPlaceholder: SEARCH_PLACEHOLDERS.default
    }
  },
  {
    match: (pathname) => pathname.startsWith("/app/workspace"),
    purpose: {
      kicker: "범위 먼저 선택",
      title: "워크스페이스 선택",
      description: "먼저 작업 범위를 고르고, 그 다음에 보드나 스프린트로 이동합니다.",
      searchPlaceholder: SEARCH_PLACEHOLDERS.default
    }
  },
  {
    match: (pathname) => pathname.startsWith("/app/projects/board"),
    purpose: {
      kicker: "실행 중심 화면",
      title: "프로젝트 보드",
      description: "작업 생성, 상태 이동, 상세 확인을 가장 빠르게 처리하는 기본 실행 화면입니다.",
      primaryAction: { label: ACTION_LABELS.createFirstTask, path: "/app/projects/board?create=1" },
      searchPlaceholder: SEARCH_PLACEHOLDERS.board
    }
  },
  {
    match: (pathname) => pathname.startsWith("/app/projects/table"),
    purpose: {
      kicker: "구조화 검토",
      title: "작업 테이블",
      description: "여러 작업을 비교하고 정리할 때 사용하는 구조화된 검토 화면입니다.",
      searchPlaceholder: SEARCH_PLACEHOLDERS.board
    }
  },
  {
    match: (pathname) => pathname.startsWith("/app/projects/timeline"),
    purpose: {
      kicker: "일정 계획",
      title: "타임라인",
      description: "작업 간 시간 순서와 일정 영향을 확인하는 계획 화면입니다.",
      searchPlaceholder: SEARCH_PLACEHOLDERS.board
    }
  },
  {
    match: (pathname) => pathname.startsWith("/app/projects/calendar"),
    purpose: {
      kicker: "날짜 기준 일정",
      title: "캘린더",
      description: "마감일과 일정 배치를 날짜 중심으로 확인합니다.",
      searchPlaceholder: SEARCH_PLACEHOLDERS.board
    }
  },
  {
    match: (pathname) => pathname.startsWith("/app/projects/dashboard"),
    purpose: {
      kicker: "요약과 드릴다운",
      title: "프로젝트 대시보드",
      description: "진행률, 블로커, 위험 신호를 읽고 바로 drilldown 합니다.",
      searchPlaceholder: SEARCH_PLACEHOLDERS.board
    }
  },
  {
    match: (pathname) => pathname.startsWith("/app/sprint"),
    purpose: {
      kicker: "계획과 리뷰 루프",
      title: "스프린트 워크스페이스",
      description: "계획 수립과 DSU 리뷰를 분리해서 같은 루프 안에서 처리합니다.",
      searchPlaceholder: SEARCH_PLACEHOLDERS.sprint
    }
  },
  {
    match: (pathname) => pathname.startsWith("/app/inbox"),
    purpose: {
      kicker: "먼저 처리할 것",
      title: "인박스",
      description: "긴급도와 출처를 보고 triage 후 관련 스레드나 작업으로 이동합니다.",
      searchPlaceholder: SEARCH_PLACEHOLDERS.inbox
    }
  },
  {
    match: (pathname) => pathname.startsWith("/app/insights"),
    purpose: {
      kicker: "평가와 대응 초안",
      title: "Schedule Intelligence",
      description: "라이브 지표와 시나리오 입력을 구분해 일정 건강도를 해석합니다.",
      searchPlaceholder: SEARCH_PLACEHOLDERS.insights
    }
  }
];

const DEFAULT_PURPOSE: SurfacePurpose = {
  kicker: "현재 작업 컨텍스트",
  title: "Orbit Tasks",
  description: "현재 범위에서 다음 행동을 빠르게 이어가세요.",
  searchPlaceholder: SEARCH_PLACEHOLDERS.default
};

export function resolveRoutePurpose(pathname: string): SurfacePurpose {
  return ROUTE_PURPOSES.find((entry) => entry.match(pathname))?.purpose ?? DEFAULT_PURPOSE;
}
