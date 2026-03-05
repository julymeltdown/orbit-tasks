# Data Model: Activation-First UI/UX Overhaul

## Modeling Principles

1. 행동 우선: “첫 행동 유도”를 모델 차원에서 추적 가능해야 한다.
2. 상태 명시: AI/empty-state/activation 진행 상태는 모두 열거형으로 표현한다.
3. 측정 가능성: 성공 기준(SC-001~SC-004)을 계산 가능한 이벤트 구조를 제공한다.

## Core Entities

## ActivationState

### Description

특정 사용자-워크스페이스-프로젝트 조합에서 first-session 활성화 진행 상태를 관리한다.

### Fields

- `activationStateId` (UUID, required)
- `workspaceId` (UUID, required)
- `projectId` (UUID, required)
- `userId` (string, required)
- `firstSessionStartedAt` (datetime, required)
- `firstTaskCreatedAt` (datetime, nullable)
- `boardInteractedAt` (datetime, nullable)
- `sprintEnteredAt` (datetime, nullable)
- `insightEvaluationStartedAt` (datetime, nullable)
- `activationStage` (enum: `NOT_STARTED`, `FIRST_ACTION_DONE`, `CORE_FLOW_CONTINUED`, `COMPLETED`)
- `completionReason` (enum: `FIRST_TASK_ONLY`, `TASK_PLUS_CORE_STEP`, `MANUAL_OVERRIDE`, nullable)
- `updatedAt` (datetime, required)

### Validation Rules

- `(workspaceId, projectId, userId)` 조합은 동시에 1개의 ACTIVE activation state만 허용.
- `firstTaskCreatedAt`은 `firstSessionStartedAt` 이전일 수 없다.
- `activationStage=COMPLETED`이면 `completionReason`이 반드시 존재해야 한다.

## ActivationStepSnapshot

### Description

Activation 진행 단계별 스냅샷(체크리스트 렌더링 및 복구용).

### Fields

- `snapshotId` (UUID)
- `activationStateId` (UUID)
- `stepCode` (enum: `CREATE_TASK`, `OPEN_BOARD`, `START_SPRINT`, `RUN_AI_INSIGHT`, `TRIAGE_INBOX`)
- `status` (enum: `LOCKED`, `AVAILABLE`, `DONE`, `SKIPPED`)
- `primaryActionPath` (string)
- `hint` (string)
- `recordedAt` (datetime)

### Validation Rules

- 동일 `activationStateId + stepCode`의 최신 레코드 1개만 UI에 사용.
- `status=DONE`이면 이전 상태가 `AVAILABLE` 또는 `SKIPPED`여야 함.

## GuidedEmptyState

### Description

페이지별 empty-state 렌더링 계약.

### Fields

- `emptyStateId` (UUID)
- `scope` (enum: `BOARD`, `SPRINT`, `INSIGHTS`, `INBOX`, `WORKSPACE_SELECT`, `DASHBOARD`)
- `title` (string, required)
- `description` (string, required)
- `statusHint` (string, nullable)
- `primaryActionLabel` (string, required)
- `primaryActionPath` (string, required)
- `secondaryActions` (json array, nullable)
- `learnMoreUrl` (string, nullable)
- `isActive` (boolean)
- `version` (int)

### Validation Rules

- 활성 empty-state(`isActive=true`)는 `scope`당 1개만 허용.
- `primaryActionPath`는 상대 경로(`/app/...`) 또는 허용된 외부 도메인만 허용.

## NavigationProfile

### Description

사용자별/역할별 Core vs Advanced 노출 정책.

### Fields

- `navigationProfileId` (UUID)
- `workspaceId` (UUID)
- `userId` (string)
- `role` (enum: `WORKSPACE_MEMBER`, `WORKSPACE_MANAGER`, `WORKSPACE_ADMIN`)
- `mode` (enum: `FIRST_SESSION`, `SIMPLIFIED`, `FULL`)
- `coreItems` (json array)
- `advancedItems` (json array)
- `lastToggledAt` (datetime, nullable)
- `updatedAt` (datetime)

### Validation Rules

- `mode=FIRST_SESSION`이면 `advancedItems` 기본 노출 금지.
- `coreItems`는 최소 3개(`Dashboard`, `Board`, `Sprint`)를 포함해야 함.

## InsightInputSignals

### Description

AI 평가 입력 기본값을 구성하는 실시간 신호.

### Fields

- `signalsId` (UUID)
- `workspaceId` (UUID)
- `projectId` (UUID)
- `remainingStoryPoints` (int, >= 0)
- `availableCapacitySp` (int, >= 0)
- `blockedCount` (int, >= 0)
- `atRiskCount` (int, >= 0)
- `source` (enum: `DERIVED_FROM_WORKITEMS`, `MANUAL_OVERRIDE`, `FALLBACK_RULE`)
- `collectedAt` (datetime)

### Validation Rules

- 수치는 음수 불가.
- `source=MANUAL_OVERRIDE`일 경우 `overrideActorId`(추가 메타) 기록 필요.

## AIGuidanceStatus

### Description

AI 결과의 설명 가능 상태를 화면 간 일관되게 표현하기 위한 뷰 모델.

### Fields

- `guidanceStatusId` (UUID)
- `workspaceId` (UUID)
- `projectId` (UUID)
- `evaluationId` (string, nullable)
- `state` (enum: `NOT_RUN`, `EVALUATED`, `FALLBACK`, `FAILED`)
- `confidence` (decimal 0.0 ~ 1.0, nullable)
- `reasonCode` (string)
- `summary` (string)
- `recommendedActions` (json array)
- `updatedAt` (datetime)

### Validation Rules

- `state=EVALUATED`이면 `evaluationId` 필수.
- `state=FALLBACK`이면 `reasonCode` 필수이며 `recommendedActions`는 1개 이상.

## ActivationEvent

### Description

Activation KPI 산출용 이벤트 로그.

### Fields

- `eventId` (UUID)
- `workspaceId` (UUID)
- `projectId` (UUID)
- `userIdHash` (string)
- `sessionId` (string)
- `eventType` (enum:
  `ACTIVATION_VIEW_LOADED`,
  `ACTIVATION_PRIMARY_CTA_CLICKED`,
  `FIRST_TASK_CREATED`,
  `BOARD_FIRST_INTERACTION`,
  `SPRINT_ENTERED`,
  `INSIGHT_EVALUATION_STARTED`,
  `INSIGHT_EVALUATION_COMPLETED`,
  `EMPTY_STATE_ACTION_CLICKED`)
- `route` (string)
- `elapsedMs` (int, >= 0)
- `metadata` (json)
- `createdAt` (datetime)

### Validation Rules

- `eventType=FIRST_TASK_CREATED`이면 `metadata.workItemId` 필수.
- `elapsedMs`는 세션 시작 기준 경과 시간으로 저장.

## DsuReminderState

### Description

DSU 미입력 상태 기반 리마인더 뷰 모델.

### Fields

- `workspaceId` (UUID)
- `projectId` (UUID)
- `sprintId` (UUID, nullable)
- `authorId` (string)
- `pending` (boolean)
- `severity` (enum: `INFO`, `WARNING`)
- `title` (string)
- `message` (string)
- `actionPath` (string)
- `dueDate` (date, nullable)
- `latestSubmittedAt` (datetime, nullable)

### Validation Rules

- `pending=false`이면 `title/message`는 “완료 상태” 문구를 사용.

## Relationships

1. `ActivationState 1:N ActivationStepSnapshot`
2. `Workspace 1:N NavigationProfile`
3. `Project 1:N InsightInputSignals`
4. `Project 1:N AIGuidanceStatus`
5. `ActivationState 1:N ActivationEvent`
6. `Project 1:N GuidedEmptyState(scope별 활성 1개)`

## State Transitions

## ActivationStage

`NOT_STARTED -> FIRST_ACTION_DONE -> CORE_FLOW_CONTINUED -> COMPLETED`

- `FIRST_ACTION_DONE`: `firstTaskCreatedAt` 기록
- `CORE_FLOW_CONTINUED`: Board/Sprint/Insight 중 1개 이상 추가 행동 기록
- `COMPLETED`: 완료 조건 충족 + completionReason 설정

## AIGuidanceStatus.state

`NOT_RUN -> EVALUATED`
`NOT_RUN -> FALLBACK`
`EVALUATED -> FALLBACK` (재평가 실패 시)
`* -> FAILED` (예외 상태, 사용자 재시도 필요)

## Derived Metrics (for Success Criteria)

- `ActivationWithin2Min`:
  - 조건: `FIRST_TASK_CREATED.elapsedMs <= 120000`
- `TimeToFirstMeaningfulAction`:
  - 기준 이벤트: `FIRST_TASK_CREATED | BOARD_FIRST_INTERACTION | SPRINT_ENTERED`
- `EmptyStateBounceRate`:
  - 분모: `ACTIVATION_VIEW_LOADED(scope)`
  - 분자: action event 없이 이탈한 세션 수

## Validation Notes

1. 표시값은 API 응답/파생 신호 기반으로만 렌더한다.
2. 하드코딩 수치(예: 고정 퍼센트/고정 SP)는 프로덕션 렌더 경로에서 금지한다.
3. first-session 판단 기준은 서버/클라이언트에서 동일 계산식을 사용한다.
