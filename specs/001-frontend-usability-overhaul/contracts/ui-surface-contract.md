# UI Surface Contract: Frontend Usability Overhaul

## Purpose

This contract defines the minimum user-facing behavior expected from the major frontend surfaces affected by the usability overhaul. It is a UX contract, not an implementation contract.

## Shared Surface Rules

1. Each major page must declare a primary purpose within the first viewport.
2. Each major page must expose only one visually dominant primary action.
3. Empty, locked, error, fallback, and loading states must explain what the state means and what the user can do next.
4. AI guidance must always declare whether it is draft, fallback, low-confidence, or ready for review.
5. Dashboard and insights metrics must resolve to semantically matching drilldowns or declare that no drilldown is available.
6. Core mobile flows must not rely on page-level horizontal scrolling.

## Route Contracts

| Route | Surface Purpose | Required Primary Action | Required Supporting Signals | Forbidden Confusion Patterns |
|---|---|---|---|---|
| `/app` | Activation or resume-work entry | One prioritized next action based on session state | Workspace context, role, resume reason if returning | Multiple equal-priority module CTAs |
| `/app/workspace/select` | Choose organizational scope | Choose workspace | Workspace role, default marker, recommended destination after selection | Multiple destination buttons before scope is selected |
| `/app/projects/board` | Daily execution of work items | Create work or inspect selected work | Current scope, sprint state, selected task context | Multiple always-open side tasks competing with the board |
| `/app/projects/table` | Bulk review and structured editing | Bulk edit or structured review action | Shared filters, row meaning, selection state | Inline CRUD fields without bulk meaning |
| `/app/projects/timeline` | Schedule planning and temporal sequencing | Adjust or inspect planned work | Time range meaning, dependency state, date impact | Bare bar list presented as a full planning tool |
| `/app/projects/calendar` | Date-based scheduling and unscheduled work management | Schedule unscheduled work or inspect scheduled work | Current date view, selected event context, unscheduled count | Calendar as a simple date-input utility without planning context |
| `/app/projects/dashboard` | Readable project summary | Drill into the most relevant metric | Metric meaning, drilldown mapping, freshness state | Metrics whose labels do not match their underlying work |
| `/app/sprint?mode=planning` | Prepare sprint scope and daily plan | Advance the current planning step | Goal, plan readiness, freeze state, prerequisites | DSU review controls presented as equal peers to planning controls |
| `/app/sprint?mode=dsu` | Submit and review daily updates | Submit DSU or review pending suggestions | Freeze prerequisite, current lock reason, suggestion status | Applied-looking changes before approval |
| `/app/inbox` | Triage operational notifications | Resolve or open the most relevant item | Preview, urgency, source object, resolution state | Bare notification rows with no action context |
| `/app/insights` | Evaluate schedule health and draft mitigations | Run evaluation or review current draft mitigations | Analysis scope, live/scenario mode, confidence, fallback status | Editable metrics that look like live telemetry |

## AI Guidance State Contract

| State | Required User Message | Required Action Pattern |
|---|---|---|
| `not_run` | Explain that no analysis has been performed yet | Offer one clear action to start evaluation |
| `evaluating` | Explain that evaluation is in progress | Prevent conflicting apply actions |
| `evaluated` | Show confidence, reason, and draft recommendations | Allow review before any apply action |
| `fallback` | Explicitly state that fallback logic was used | Offer rerun and explain reduced certainty |
| `unavailable` | Explain why guidance is unavailable | Offer recovery path or alternate manual workflow |
| `low_confidence` | Explain uncertainty and what needs confirmation | Require extra review before approval |

## Empty State Contract

| Field | Requirement |
|---|---|
| Purpose statement | Must say what the page is for |
| Absence reason | Must say why the page is empty or blocked |
| Primary action | Must provide exactly one primary next step |
| Secondary actions | Optional, maximum two |
| Learn more | Optional, only when education reduces confusion |

## Drilldown Contract

1. Any metric card displayed on dashboard or insights must map to one of:
- a filtered work-item collection,
- a sprint-scoped collection,
- an inbox triage collection,
- or a clearly declared non-drilldown state.
2. A metric label must not reuse a task-state name if the underlying set means something different.
3. If no underlying work exists, the drilldown destination must explain the zero-result state rather than silently navigate to a blank screen.
