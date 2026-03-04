# Data Model: Orbit Schedule Enterprise UI/UX Re-Architecture

## Modeling Principles

1. 객체 우선: 페이지가 아니라 객체가 시스템의 진실 원천이다.
2. 멀티뷰 동일성: Board/Table/Timeline/Calendar/Dashboard는 같은 Work Item 집합을 다른 시각으로 보여준다.
3. 컨텍스트 연속성: Inbox/Thread/AI 결과는 항상 원본 객체를 참조한다.

## Core Entities

## Workspace

### Description
조직의 최상위 협업 범위.

### Fields
- `workspaceId` (UUID, required, immutable)
- `name` (string, required, 2~60자)
- `slug` (string, required, unique)
- `defaultWorkspace` (boolean)
- `status` (enum: `ACTIVE`, `ARCHIVED`)
- `createdAt`, `updatedAt`

### Rules
- 사용자는 최소 1개의 기본 워크스페이스를 가질 수 있다.
- 회원가입 성공 시 기본 워크스페이스가 자동 생성되어야 한다.

## Project

### Description
작업 계획/실행이 이루어지는 범위 객체.

### Fields
- `projectId` (UUID, required)
- `workspaceId` (UUID, required)
- `name` (string, required)
- `status` (enum: `ACTIVE`, `ON_HOLD`, `ARCHIVED`)
- `startDate`, `targetDate` (date, optional)
- `createdAt`, `updatedAt`

### Rules
- 프로젝트는 반드시 하나의 워크스페이스에 속한다.
- 보관된 프로젝트는 쓰기 작업이 제한된다.

## ViewConfiguration

### Description
프로젝트 데이터의 표현 방식과 사용자 지정 설정.

### Fields
- `viewConfigId` (UUID)
- `projectId` (UUID)
- `ownerScope` (enum: `USER`, `TEAM`, `PROJECT_DEFAULT`)
- `viewType` (enum: `BOARD`, `TABLE`, `TIMELINE`, `CALENDAR`, `DASHBOARD`)
- `filters` (json)
- `sort` (json)
- `groupBy` (string, optional)
- `isDefault` (boolean)
- `createdBy`, `createdAt`, `updatedAt`

### Rules
- 같은 `ownerScope` 내 기본 뷰는 viewType별 1개만 허용한다.
- 뷰 전환은 동일 `projectId` 데이터셋에서만 수행된다.

## WorkItem

### Description
실행 단위의 핵심 객체.

### Fields
- `workItemId` (UUID)
- `projectId` (UUID)
- `title` (string, required, 1~240자)
- `description` (markdown, optional)
- `type` (enum: `TASK`, `STORY`, `BUG`, `EPIC`, `IMPROVEMENT`)
- `status` (enum: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`, `ARCHIVED`)
- `priority` (enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `assigneeId` (string, optional)
- `startAt`, `dueAt` (datetime, optional)
- `riskFlag` (enum: `NONE`, `AT_RISK`, `BLOCKED`)
- `dependencyCount` (derived)
- `createdAt`, `updatedAt`

### Rules
- `ARCHIVED` 상태는 일반 보드 목록 기본 노출에서 제외된다.
- `dueAt`이 `startAt`보다 빠를 수 없다.
- 모바일/데스크톱 모두에서 상태 전환 대체 동작(비드래그)이 있어야 한다.

## Dependency

### Description
WorkItem 간 선후행 관계.

### Fields
- `dependencyId` (UUID)
- `fromWorkItemId` (UUID)
- `toWorkItemId` (UUID)
- `type` (enum: `FS`, `SS`, `FF`, `SF`)
- `createdBy`, `createdAt`

### Rules
- 순환 의존성은 허용되지 않는다.
- 의존성 편집은 상세 패널 또는 타임라인 전용 모드에서 수행한다.

## Sprint

### Description
기간 기반 실행 단위.

### Fields
- `sprintId` (UUID)
- `workspaceId` (UUID)
- `projectId` (UUID)
- `name` (string, required)
- `goal` (string, required)
- `startDate`, `endDate` (date, required)
- `capacitySp` (number, >= 1)
- `status` (enum: `PLANNED`, `ACTIVE`, `COMPLETED`)
- `createdAt`, `updatedAt`

### Rules
- 한 프로젝트에는 동시에 `ACTIVE` 스프린트 1개만 허용한다.
- 활성 스프린트가 없으면 안내형 empty state를 제공해야 한다.

## SprintBacklogEntry

### Description
스프린트에 포함된 WorkItem의 실행 상태.

### Fields
- `backlogEntryId` (UUID)
- `sprintId` (UUID)
- `workItemId` (UUID)
- `rank` (int, >= 1)
- `status` (enum: `READY`, `IN_PROGRESS`, `DONE`, `REMOVED`)
- `createdAt`, `updatedAt`

### Rules
- 같은 스프린트 내 `workItemId`는 중복될 수 없다.

## DSUEntry

### Description
일일 실행 보고(원문 + 구조화 신호).

### Fields
- `dsuId` (UUID)
- `sprintId` (UUID, optional)
- `workspaceId` (UUID)
- `projectId` (UUID)
- `authorId` (string)
- `rawText` (text, required)
- `signals` (json: blockers/asks/items/confidence)
- `createdAt`

### Rules
- AI 실패 시에도 원문 DSU는 저장되어야 한다.
- `signals`는 비어 있을 수 있으나 상태(`pending/processed/fallback`)를 가져야 한다.

## Thread

### Description
WorkItem 문맥 대화의 상위 객체.

### Fields
- `threadId` (UUID)
- `workspaceId` (UUID)
- `projectId` (UUID)
- `workItemId` (UUID, optional)
- `title` (string)
- `status` (enum: `OPEN`, `RESOLVED`)
- `createdBy`, `createdAt`, `updatedAt`

### Rules
- Thread는 가능하면 WorkItem에 연결되어야 하며, 연결되지 않은 경우 명시적 목적이 필요하다.

## ThreadMessage

### Fields
- `messageId` (UUID)
- `threadId` (UUID)
- `authorId` (string)
- `content` (markdown/text)
- `mentions` (array of userId)
- `createdAt`

## InboxItem

### Description
사용자 triage 대상 이벤트.

### Fields
- `inboxItemId` (UUID)
- `recipientId` (string)
- `kind` (enum: `NOTIFICATION`, `REQUEST`, `MENTION`, `AI_QUESTION`)
- `sourceType` (enum: `THREAD`, `WORK_ITEM`, `SPRINT`, `EVALUATION`)
- `sourceId` (string)
- `title`, `summary`
- `status` (enum: `UNREAD`, `READ`, `RESOLVED`)
- `deepLink` (string)
- `createdAt`, `resolvedAt`

### Rules
- Inbox 항목은 원본 객체로 이동 가능한 링크를 가져야 한다.
- `RESOLVED` 전환 시 행동 로그(누가/언제/메모)를 남긴다.

## Portfolio

### Description
다수 프로젝트를 묶는 상위 운영 단위.

### Fields
- `portfolioId` (UUID)
- `workspaceId` (UUID)
- `name` (string)
- `status` (enum: `ACTIVE`, `ARCHIVED`)
- `createdAt`, `updatedAt`

## PortfolioProject

### Fields
- `portfolioId` (UUID)
- `projectId` (UUID)
- `weight` (number, optional)

## ScheduleEvaluation

### Description
일정 건강도 분석 결과.

### Fields
- `evaluationId` (UUID/string)
- `workspaceId`, `projectId`, `sprintId` (optional)
- `health` (enum: `HEALTHY`, `WARNING`, `AT_RISK`)
- `topRisks` (array)
- `questions` (array)
- `confidence` (0~1)
- `fallback` (boolean)
- `reason` (string)
- `createdAt`

### Rules
- 평가 결과는 근거 객체 참조를 포함해야 한다.
- 실패 시 `fallback=true`와 이유를 남겨야 한다.

## PolicyControl

### Description
관리자 정책(권한/감사/AI 통제).

### Fields
- `policyId` (UUID)
- `workspaceId` (UUID)
- `policyType` (enum: `RETENTION`, `AI_CONTROL`, `ACCESS`)
- `payload` (json)
- `version` (int)
- `updatedBy`, `updatedAt`

## Relationships

1. `Workspace 1:N Project`
2. `Project 1:N WorkItem`
3. `Project 1:N ViewConfiguration`
4. `WorkItem N:M WorkItem` via `Dependency`
5. `Project 1:N Sprint`
6. `Sprint 1:N SprintBacklogEntry`
7. `SprintBacklogEntry N:1 WorkItem`
8. `Thread N:1 WorkItem` (optional)
9. `Thread 1:N ThreadMessage`
10. `InboxItem N:1 SourceObject` (polymorphic)
11. `Portfolio N:M Project`
12. `ScheduleEvaluation N:1 Project`

## State Transitions

## WorkItem.status

`TODO -> IN_PROGRESS -> REVIEW -> DONE -> ARCHIVED`

- `ARCHIVED`는 종단 상태, 복구는 별도 관리 권한 필요.

## Sprint.status

`PLANNED -> ACTIVE -> COMPLETED`

- `ACTIVE`는 프로젝트 단위 단일성 제약.

## Thread.status

`OPEN -> RESOLVED`

- `RESOLVED` 전환 시 관련 inbox item 정리 동작 가능.

## InboxItem.status

`UNREAD -> READ -> RESOLVED`

## Validation Notes

1. 사용자 입력 라벨/이름은 UUID 노출 대신 사람이 읽을 수 있는 이름 필드를 우선 노출한다.
2. 모든 빈 상태는 CTA 포함형으로 렌더링한다.
3. 모바일 레이아웃은 폭 고정값 대신 상대 단위(`%`, `minmax`, `clamp`)를 기본으로 사용한다.
