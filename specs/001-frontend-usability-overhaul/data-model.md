# Data Model: Frontend Usability Overhaul

## 1. ActivationSurfaceState

**Purpose**: Represents the first-session or low-context entry state that guides a user toward the next meaningful action.

| Field | Type | Description | Validation |
|---|---|---|---|
| `sessionType` | enum | `first_session`, `returning_user`, `recovery_state` | Required |
| `workspaceState` | enum | `none_selected`, `selected`, `restricted` | Required |
| `primaryAction` | object | Highest-priority action shown to the user | Required |
| `secondaryActions` | list | Up to two supporting actions | Max 2 |
| `checklistState` | object | Progress summary for onboarding/resume work | Optional |
| `blockingReason` | string | Human-readable reason when the next step is blocked | Optional |
| `resumeTarget` | object | Most relevant unfinished work for returning users | Optional |

**Relationships**:
- Depends on `WorkspaceContext`
- Can reference `ProjectViewContext`, `SprintModeState`, or `InboxTriageItem`

## 2. WorkspaceContext

**Purpose**: Defines the currently selected organizational scope and permission posture.

| Field | Type | Description | Validation |
|---|---|---|---|
| `workspaceId` | string | Unique workspace identifier | Required when selected |
| `workspaceName` | string | Human-readable workspace name | Required when selected |
| `role` | enum | Member capability level visible to UI | Required when selected |
| `isDefault` | boolean | Whether this is the user’s default workspace | Required |
| `selectionStatus` | enum | `unselected`, `selected`, `auto_selected` | Required |
| `nextRecommendedDestination` | object | Preferred follow-up path once scope is chosen | Optional |

**Relationships**:
- Owns `ProjectViewContext`, `ScheduleIntelligenceState`, `InboxTriageItem`

## 3. NavigationSurfaceState

**Purpose**: Represents visible navigation layers and disclosure state.

| Field | Type | Description | Validation |
|---|---|---|---|
| `scopeSection` | enum | Current top-level area such as home, sprint, inbox, insights | Required |
| `projectView` | enum | Current project representation if applicable | Optional |
| `advancedVisible` | boolean | Whether advanced destinations or filters are expanded | Required |
| `roleFilteredItems` | list | Destinations visible to the current role | Required |
| `searchState` | enum | `idle`, `typing`, `results`, `no_results` | Required |

**Validation rules**:
- Scope navigation and project-view navigation cannot claim the same level of meaning.
- Only one AI assistance entry point can be primary within a single context.

## 4. ProjectViewContext

**Purpose**: Shared view state preserved across board, table, timeline, calendar, and dashboard.

| Field | Type | Description | Validation |
|---|---|---|---|
| `projectId` | string | Active project identifier | Required |
| `query` | string | Shared search/filter query | Optional |
| `statusFilter` | string | Shared work-state filter | Optional |
| `assigneeFilter` | string | Shared assignee filter | Optional |
| `sprintOnly` | boolean | Whether the current project views are restricted to the active sprint | Required |
| `selectedWorkItemId` | string | Currently selected work item | Optional |
| `viewIntent` | enum | `execution`, `bulk_edit`, `planning`, `schedule`, `summary` | Required |

**Relationships**:
- References `WorkItemSummary`
- Informs `ScheduleIntelligenceState` scope

## 5. WorkItemSummary

**Purpose**: Represents the work object as seen in execution and planning surfaces.

| Field | Type | Description | Validation |
|---|---|---|---|
| `workItemId` | string | Unique work identifier | Required |
| `title` | string | Human-readable task title | Required |
| `statusLabel` | string | User-facing status text | Required |
| `priorityLabel` | string | User-facing priority text | Optional |
| `assigneeLabel` | string | Visible owner value | Optional |
| `dueLabel` | string | Visible due-state label | Optional |
| `blockedState` | enum | `not_blocked`, `blocked`, `awaiting_review`, `needs_attention` | Required |
| `detailPriorityGroup` | object | Ordered property groups for task inspection | Required |

**Validation rules**:
- User-facing status meanings must remain semantically stable across all views.
- Metric drilldowns must resolve to these same objects.

## 6. BoardExecutionState

**Purpose**: Captures the board’s operational state.

| Field | Type | Description | Validation |
|---|---|---|---|
| `activeSprintState` | enum | `none`, `planned`, `frozen`, `closed` | Required |
| `composerState` | enum | `closed`, `quick_create`, `expanded_create` | Required |
| `inspectorState` | enum | `none_selected`, `detail_open`, `dependency_open` | Required |
| `primaryCta` | object | Primary visible action in board context | Required |
| `emptyStateVariant` | enum | `no_sprint`, `no_work_items`, `filtered_empty` | Optional |

## 7. SprintModeState

**Purpose**: Separates planning and DSU review inside the sprint domain.

| Field | Type | Description | Validation |
|---|---|---|---|
| `mode` | enum | `planning`, `dsu_review` | Required |
| `step` | enum | Current planning step or review stage | Required |
| `freezeState` | enum | `not_started`, `draft_ready`, `frozen` | Required |
| `prerequisiteState` | enum | `ready`, `blocked` | Required |
| `blockingReason` | string | Why DSU or approvals are unavailable | Optional |
| `handoffMessage` | string | Explains how planning leads into DSU review | Required |

## 8. DSUSuggestionReview

**Purpose**: Human-readable representation of an AI-derived DSU suggestion awaiting decision.

| Field | Type | Description | Validation |
|---|---|---|---|
| `suggestionId` | string | Unique suggestion identifier | Required |
| `targetLabel` | string | Human-readable target object | Required |
| `proposedSummary` | string | Short summary of the proposed change | Required |
| `rationale` | string | Explanation of why the suggestion exists | Required |
| `confidenceBand` | enum | `high`, `medium`, `low` | Required |
| `decisionState` | enum | `pending`, `approved`, `rejected` | Required |
| `appliedState` | enum | `not_applied`, `applied` | Required |

**Validation rules**:
- `appliedState` cannot become `applied` while `decisionState` is `pending`.
- Low-confidence suggestions must surface clarification language before approval.

## 9. ScheduleIntelligenceState

**Purpose**: Represents the state of the schedule intelligence surface and its explanation model.

| Field | Type | Description | Validation |
|---|---|---|---|
| `analysisScope` | enum | `workspace`, `project`, `sprint`, `selected_work_item` | Required |
| `dataMode` | enum | `live`, `scenario` | Required |
| `evaluationState` | enum | `not_run`, `evaluating`, `evaluated`, `fallback`, `unavailable` | Required |
| `confidenceBand` | enum | `high`, `medium`, `low`, `none` | Required |
| `reasonLabel` | string | Human-readable explanation of current state | Required |
| `topRecommendations` | list | Draft actions and rationale | Optional |
| `metricCards` | list | Metric summaries with drilldown meaning | Required |

**Validation rules**:
- Live and scenario metrics must not be visually indistinguishable.
- Every metric card needs a drilldown meaning or an explicit “no drilldown” state.

## 10. InboxTriageItem

**Purpose**: Operational notification object used for triage.

| Field | Type | Description | Validation |
|---|---|---|---|
| `inboxItemId` | string | Unique inbox item identifier | Required |
| `kindLabel` | string | Human-readable type label | Required |
| `sourceLabel` | string | User-facing source description | Required |
| `preview` | string | Short contextual summary | Required |
| `urgencyBand` | enum | `high`, `medium`, `low` | Required |
| `recommendedAction` | object | Primary next step | Required |
| `resolutionState` | enum | `unread`, `read`, `resolved` | Required |
| `deepLinkTarget` | object | Destination for more detail | Optional |

## 11. CollaborationThreadContext

**Purpose**: Context model for discussion anchored to work.

| Field | Type | Description | Validation |
|---|---|---|---|
| `threadId` | string | Unique thread identifier | Required |
| `title` | string | Subject of the thread | Required |
| `sourceObjectLabel` | string | Work object or workflow source | Required |
| `messagePreview` | string | Most recent meaningful content summary | Optional |
| `participantSummary` | string | Visible participant context | Optional |
| `nextExpectedAction` | string | What this thread is trying to resolve | Optional |

## 12. EmptyStateContract

**Purpose**: Shared instructional structure for all major empty states.

| Field | Type | Description | Validation |
|---|---|---|---|
| `title` | string | What state the user is in | Required |
| `description` | string | Why the page is empty and why it matters | Required |
| `statusHint` | string | Short supporting status signal | Optional |
| `primaryAction` | object | Most important next action | Required |
| `secondaryActions` | list | Supporting actions | Max 2 |
| `learnMoreLabel` | string | Optional learning path label | Optional |
| `learnMoreTarget` | object | Optional educational path | Optional |

**Validation rules**:
- Every empty state must have exactly one primary action.
- Empty states cannot be purely decorative.
