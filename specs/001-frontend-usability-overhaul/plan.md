# Implementation Plan: Frontend Usability Overhaul

**Branch**: `001-frontend-usability-overhaul` | **Date**: 2026-03-06 | **Spec**: `/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/spec.md`  
**Input**: Feature specification from `/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/spec.md` + frontend codebase audit

## Summary

This feature is a product-surface overhaul focused on learnability, clarity, and trust.
The current codebase already contains most of the product surfaces the user expects, but they behave like adjacent feature islands rather than one coherent workflow.

The plan is to restructure the frontend around five concrete outcomes:

1. Reduce control-plane competition in the shell and major pages.
2. Turn activation, workspace entry, and empty states into explicit guidance surfaces.
3. Rebuild board, sprint, DSU, inbox, and insights around one clear next action per state.
4. Make schedule intelligence trustworthy by separating live telemetry from scenario editing and by standardizing AI state explanations.
5. Enforce shared semantics across board, table, timeline, calendar, dashboard, and insights so the same work means the same thing everywhere.

This plan is frontend-heavy, but it also defines the minimum behavioral contracts needed from the existing gateway-backed data so the interface can remain trustworthy.

## Codebase Scan Baseline

### Frontend shell, navigation, and design system

- `/home/lhs/dev/tasks/frontend/orbit-web/src/app/AppShell.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/app/router.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/app/navigationModel.ts`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/design/tokens.css`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/design/primitives.css`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/design/layout.css`

### Entry and onboarding surfaces

- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/public/LandingPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/onboarding/ProfileOnboardingPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/activation/ActivationChecklist.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/common/EmptyStateCard.tsx`

### Core work management surfaces

- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/projects/ProjectFilterBar.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/projects/ProjectViewTabs.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/projects/WorkItemDetailPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/projects/DependencyInspectorPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/TablePage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/TimelinePage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/CalendarPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/DashboardPage.tsx`

### Sprint, DSU, and intelligence surfaces

- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/SprintWizardStepInfo.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/SprintWizardStepBacklog.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/SprintWizardStepDayPlan.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/DSUComposerPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/DSUSuggestionReviewPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/insights/AICoachPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/insights/FloatingAgentWidget.tsx`

### Collaboration surfaces

- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/collaboration/ThreadPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/collaboration/InboxFilterBar.tsx`

### Existing codebase findings that drive this plan

1. App shell still contains multiple competing control planes: scope navigation, project views, top-bar actions, DSU reminder, right rail summaries, and a floating AI trigger.
2. Workspace selection and activation still front-load too many choices before scope and next action are obvious.
3. Board is the daily execution surface but still competes with surrounding controls and utility panels.
4. Sprint and DSU are conceptually related but still not legible as a single loop with distinct phases.
5. Insights currently mixes live metric interpretation with editable scenario inputs in a way that weakens trust.
6. Dashboard metrics and drilldowns are not yet semantically strict enough.
7. Table, timeline, and calendar still over-assume desktop width and treat mobile as a containment problem rather than a first-class usage mode.
8. Design primitives are more consistent than before, but most surfaces still feel visually equivalent even when their product roles are different.

## Technical Context

**Language/Version**: Java 17, TypeScript 5.9, React 18, Spring Boot 4.0.1  
**Primary Dependencies**: React Router 6.30, Zustand 4.5, dnd-kit 6.3, FullCalendar 6.1, React Markdown 10.1, Vitest 2.1, Playwright, Spring Security 7, Spring gRPC 1.0.2  
**Storage**: Frontend consumes gateway-backed in-memory and service-backed persisted state; no new storage engine required for this feature plan  
**Testing**: Vitest, Playwright, ESLint, TypeScript build, JUnit5, ArchUnit, JaCoCo  
**Target Platform**: Responsive web application for desktop and mobile browsers  
**Project Type**: Frontend SPA with existing API gateway and Spring microservices  
**Performance Goals**:
- First meaningful action path visually understood within the first viewport
- No page-level horizontal scrolling at 360px width for core flows
- No new heavy persistent shell surfaces that degrade scanability or interaction speed
- No increase in perceived interaction steps for primary workflows (task creation, DSU submission, inbox triage, evaluation run)
**Constraints**:
- No code generation-only redesign; changes must align with existing product domain
- AI guidance remains draft-only until user approval
- Existing microservice contracts and hexagonal boundaries must not be violated by UI-driven changes
- Avoid hardcoded operational metrics in user-facing surfaces
- Preserve shared work-item mental model across views
**Scale/Scope**:
- Frontend scope spans `/app`, `/app/workspace/select`, `/app/projects/*`, `/app/sprint`, `/app/inbox`, `/app/insights`
- Backend impact is limited to the minimum contract clarification needed for trustworthy UI behavior
- Surface count affected: activation, workspace entry, board, table, timeline, calendar, dashboard, sprint, DSU, insights, inbox, thread, shell

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `/home/lhs/dev/tasks/backend/orbit-platform/.specify/memory/constitution.md`

### Pre-Design Gate

| Gate | Constitution Rule | Status | Notes |
|---|---|---|---|
| C1 | Service Autonomy & Independent Lifecycle | PASS | This feature is primarily frontend-facing and does not require collapsing service boundaries. |
| C2 | Official Documentation-First (Spring Security 7 & Spring gRPC) | PASS | No framework-extension work is planned. If backend security or gRPC behavior changes become necessary later, official documentation must be cited at task level. |
| C3 | Contracted Interfaces & Versioning | PASS | This plan introduces a UI surface contract and keeps any API behavior changes within explicit documented contracts rather than ad hoc UI assumptions. |
| C4 | Hexagonal Architecture Enforcement | PASS | No plan item requires pushing UI-specific logic into domain or application layers. Gateway or service updates, if any, remain adapter-facing only. |

### Post-Design Re-check

| Gate | Status | Re-check Result |
|---|---|---|
| C1 | PASS | Design artifacts keep UI state and user-facing contracts separate from service-internal implementation. |
| C2 | PASS | No Spring Security 7 or Spring gRPC design deviation introduced. |
| C3 | PASS | User-facing behavioral expectations are now documented explicitly in `/contracts/ui-surface-contract.md`. |
| C4 | PASS | Planned backend support remains interface-level; no hexagonal boundary breach is required by the design. |

## Project Structure

### Documentation (this feature)

```text
/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-surface-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
/home/lhs/dev/tasks/
├── frontend/orbit-web/
│   ├── src/app/
│   ├── src/pages/
│   ├── src/components/
│   ├── src/features/
│   ├── src/stores/
│   └── src/design/
├── backend/orbit-platform/services/
│   ├── api-gateway/
│   ├── agile-ops-service/
│   ├── collaboration-service/
│   ├── schedule-intelligence-service/
│   └── workgraph-service/
└── tests/
    ├── contract/
    ├── integration/
    └── e2e/
```

**Structure Decision**: This remains a web-application plan with an existing frontend SPA and supporting gateway-backed service layer. The feature work is centered in `/home/lhs/dev/tasks/frontend/orbit-web/src`, with contract clarification and any required support changes constrained to existing service boundaries.

## Complexity Tracking

No constitution violations are expected for this feature. No justified complexity exceptions are required at planning time.

## Phase 0: Research Summary

Detailed research decisions are documented in `/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/research.md`.

### Consolidated Decisions

1. Scope-first navigation and in-context project view switching.
2. One primary AI assistance entry point competing for attention at a time.
3. Minimum profile completion before entry, with optional enrichment deferred.
4. Workspace selection before destination choice.
5. Board as the primary execution surface, not a control cockpit.
6. Sprint planning and DSU review as separate modes in one workflow domain.
7. Schedule intelligence split into live-data mode and scenario mode.
8. Dashboard and insight metrics governed by explicit semantic contracts.
9. Inbox triage enriched with actionable context.
10. Responsive design forbids page-level horizontal scrolling for core flows.
11. Korean-first, concept-stable product vocabulary.
12. Empty states as instructional surfaces with one primary next action.

### Research Impact on Design

These decisions directly constrain the implementation plan:
- Shell and navigation changes cannot be treated as cosmetic; they define mental model boundaries.
- AI UI work must be coordinated across shell, sprint, board, and insights rather than implemented page-by-page.
- Responsive fixes must be planned at layout and surface-contract level, not as one-off CSS patches.
- Metrics, drilldowns, and fallback language require product-level semantic definitions, not per-page improvisation.

## Phase 1: Design & Contracts

### 1. Information Architecture Redesign

#### 1.1 Global shell redesign

**Objective**: Make the app answer two questions immediately: “Where am I?” and “What should I do next?”

**Planned changes**:
- Reduce persistent shell competition by differentiating:
  - global scope navigation,
  - local project view switching,
  - passive status summaries,
  - explicit AI invocation.
- Reframe the shell so global navigation changes scope and in-page controls change representation.
- Demote or remove persistent surfaces that duplicate AI guidance or compete with page-local actions.

**Design output**:
- Shell hierarchy contract
- Visibility rules for nav, summary rail, and AI entry
- Resume-work behavior for returning users

#### 1.2 Activation and workspace entry redesign

**Objective**: Convert activation from “fill fields and choose from many destinations” into “understand your scope and start the first meaningful task.”

**Planned changes**:
- First-session entry screen with one primary CTA and at most two secondary actions.
- Workspace selector that establishes scope first and recommends the next destination second.
- Non-blocking handling of optional profile enrichment.
- Explicit transition from “activation state” to “normal work state.”

**Design output**:
- Activation surface states
- Workspace selection decision tree
- Minimum profile gating rules

### 2. Execution Surface Redesign

#### 2.1 Board

**Objective**: Make board scanning, task creation, task inspection, and task movement feel immediate.

**Planned changes**:
- Clarify board header purpose and current sprint/work scope.
- Reduce always-visible secondary controls.
- Make the side area strictly contextual: either create, inspect, or review dependency context, but not all at equal prominence.
- Reorder detail content to show task state, next action, and critical properties before secondary notes/history.
- Make no-sprint and no-work empty states explicitly instructional.

**Design output**:
- Board interaction hierarchy
- Task detail information order
- Board empty-state and locked-state variants

#### 2.2 Table, Timeline, Calendar, Dashboard

**Objective**: Make alternate views feel like alternate representations of the same work, not separate feature islands.

**Planned changes**:
- Table: emphasize structured review and bulk intent rather than inline CRUD everywhere.
- Timeline: align the page with scheduling/planning expectations rather than a simple bar list.
- Calendar: clarify scheduling intent, unscheduled work management, and selected-event context.
- Dashboard: define trustworthy metric meanings and drilldown contracts.

**Design output**:
- View-specific intent definitions
- Metric semantics table
- Mobile fallback mode expectations for each view

### 3. Sprint and DSU Loop Redesign

**Objective**: Make planning and daily review feel like one product loop with two explicit phases.

**Planned changes**:
- Sprint area defaults to planning or DSU mode based on readiness state.
- Each mode explains its purpose and prerequisites.
- DSU suggestion review becomes readable, human-facing, and confidence-aware.
- Approval remains separate from application, with visible pending states.

**Design output**:
- Sprint mode state machine
- DSU explanation and review contract
- Locked/prerequisite messaging spec

### 4. Intelligence and Collaboration Redesign

#### 4.1 Schedule intelligence

**Objective**: Make schedule guidance explainable and trustworthy.

**Planned changes**:
- Split live and scenario modes visibly.
- Standardize AI state patterns across not-run, evaluating, evaluated, fallback, unavailable, and low-confidence.
- Require visible reasoning, confidence, and draft/apply distinction.
- Align insights and dashboard metrics so the user can validate what the AI is talking about.

**Design output**:
- AI guidance state contract
- Insight page mode model
- Drilldown and recommendation review behavior

#### 4.2 Inbox and thread

**Objective**: Turn inbox from a bare event list into a triage tool.

**Planned changes**:
- Add preview context, urgency framing, and recommended next action to inbox items.
- Tie thread view clearly back to source work and operational intent.
- Make resolve behavior explicit and legible.

**Design output**:
- Inbox triage item contract
- Thread context contract
- Resolution-state visibility rules

### 5. Design Language and Content Consistency

**Objective**: Improve perceived product quality by making the interface feel deliberate and consistent.

**Planned changes**:
- Define Korean-first product vocabulary for headings, states, actions, and helper text.
- Recalibrate primary, secondary, and tertiary action styling.
- Reduce “all surfaces look equally important” syndrome by differentiating page roles visually.
- Replace CSS flattening as a design crutch with more intentional surface ownership rules over time.

**Design output**:
- Vocabulary map
- Action hierarchy matrix
- Surface intent rules

### 6. Responsive and Accessibility Design

**Objective**: Make core flows usable on smaller screens and under keyboard/focus constraints.

**Planned changes**:
- Define mobile-priority layouts for activation, board access, sprint mode switching, inbox triage, and insights review.
- Require no page-level horizontal scroll in primary flows.
- Ensure focus, empty, fallback, and locked states remain understandable.
- Preserve action availability under smaller-width layouts without hiding the primary next step.

**Design output**:
- Mobile behavior contract by route
- Focus and state visibility expectations

## Phase 2: Implementation Planning (Task-ready Decomposition)

### Workstream A: Shell and Navigation Simplification

**Primary files**:
- `/home/lhs/dev/tasks/frontend/orbit-web/src/app/AppShell.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/app/navigationModel.ts`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/design/layout.css`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/design/primitives.css`

**Objectives**:
- Remove competing persistent AI/navigation cues.
- Clarify scope vs representation.
- Surface a stable resume-work pattern.

**Deliverables**:
- Reduced shell hierarchy
- Explicit primary AI entry strategy
- Search result behavior contract

**Primary risks**:
- Accidentally hiding too much for power users
- Breaking existing path discoverability

### Workstream B: Activation, Profile, and Workspace Entry

**Primary files**:
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/onboarding/ProfileOnboardingPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/activation/ActivationChecklist.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/common/EmptyStateCard.tsx`

**Objectives**:
- Remove blocking optional-profile friction.
- Make workspace selection scope-first.
- Turn activation into a guided, single-primary-action flow.

**Deliverables**:
- Activation state redesign
- Workspace scope-first decision flow
- Shared empty-state contract usage

**Primary risks**:
- Backend profile-completion assumptions may need alignment later
- Resume-work logic can become ambiguous if not kept simple

### Workstream C: Board and Task Detail Execution Flow

**Primary files**:
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/projects/WorkItemDetailPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/projects/DependencyInspectorPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/projects/ProjectFilterBar.tsx`

**Objectives**:
- Make board the clear primary execution tool.
- Reduce visual competition inside board context.
- Reorder detail content by decision value.

**Deliverables**:
- Board hierarchy redesign
- Simplified side-pane behavior
- Human-readable task detail prioritization

**Primary risks**:
- Over-reduction can remove useful power-user workflows
- Dependency inspection may need to move laterally without feeling hidden

### Workstream D: Sprint Planning and DSU Review

**Primary files**:
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/SprintWizardStepInfo.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/SprintWizardStepBacklog.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/SprintWizardStepDayPlan.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/DSUComposerPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/DSUSuggestionReviewPanel.tsx`

**Objectives**:
- Distinguish planning from review.
- Make prerequisites legible.
- Make DSU suggestions reviewable in natural language.

**Deliverables**:
- Sprint/DSU mode state machine in UI
- DSU review contract-driven surface
- Lock-state and approval-state explanations

**Primary risks**:
- Users may still blur planning and review if copy is weak
- Suggestion readability can regress if raw payload shapes leak into the UI

### Workstream E: Schedule Intelligence and Dashboard Trust

**Primary files**:
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/insights/AICoachPanel.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/insights/FloatingAgentWidget.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/DashboardPage.tsx`

**Objectives**:
- Separate live vs scenario mode.
- Standardize AI guidance states.
- Correct metric semantics and drilldowns.

**Deliverables**:
- Intelligence mode separation
- Confidence/fallback/draft labeling rules
- Dashboard metric contract alignment

**Primary risks**:
- Existing backend signals may not yet fully support the semantics users expect
- Users may mistrust intelligence if metrics and recommendations are not aligned simultaneously

### Workstream F: Inbox and Collaboration Triage

**Primary files**:
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/collaboration/InboxFilterBar.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/collaboration/ThreadPanel.tsx`

**Objectives**:
- Make triage faster with context-rich items.
- Restore discussion-to-work linkage.
- Clarify resolution state and next steps.

**Deliverables**:
- Inbox card context contract
- Thread context presentation improvements
- Resolve behavior clarity

**Primary risks**:
- Without richer backend payloads, preview context may still be thin
- Overloading inbox items with detail could slow scanning if hierarchy is not strong

### Workstream G: Alternate View Consistency and Mobile Resilience

**Primary files**:
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/TablePage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/TimelinePage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/CalendarPage.tsx`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/components/projects/ProjectViewTabs.tsx`

**Objectives**:
- Preserve shared context across views.
- Give each view a clear product role.
- Remove page-level horizontal scroll dependence from core mobile flows.

**Deliverables**:
- View-intent alignment
- Mobile fallback behaviors
- Shared-context continuity rules

**Primary risks**:
- Timeline and table may still require staged improvements rather than a single pass
- Responsive fixes may expose deeper component-structure assumptions

### Workstream H: Content, Language, and Design System Cleanup

**Primary files**:
- `/home/lhs/dev/tasks/frontend/orbit-web/src/design/tokens.css`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/design/primitives.css`
- `/home/lhs/dev/tasks/frontend/orbit-web/src/design/layout.css`
- all major page headings and action labels in affected surfaces

**Objectives**:
- Make vocabulary consistent.
- Restore clear action hierarchy.
- Reduce the “same card everywhere” feel.

**Deliverables**:
- Product vocabulary map applied to major surfaces
- Action hierarchy cleanup
- Surface styling intent separation

**Primary risks**:
- Superficial polish without semantic cleanup would waste effort
- Copy consistency may be undermined if page-specific exceptions are not documented

### Workstream I: Validation, Telemetry, and Regression Safety

**Primary files**:
- frontend tests under `/home/lhs/dev/tasks/frontend/orbit-web/src/**/*.test.tsx`
- end-to-end tests under `/home/lhs/dev/tasks/tests`
- any activation telemetry touchpoints already in use

**Objectives**:
- Prove first-step clarity and metric trust improvements.
- Protect behavior through unit, integration, and mobile checks.
- Establish measurable acceptance evidence for activation and explanation quality.

**Deliverables**:
- Usability-critical regression tests
- Metric/drilldown validation coverage
- Mobile-width verification coverage

**Primary risks**:
- If telemetry contracts are not clarified early, success criteria become hard to measure
- Over-reliance on static tests will miss interaction regressions

## Delivery Sequence

### Sequence 1: Trust and activation foundation

1. Shell/navigation simplification
2. Activation/workspace/profile friction reduction
3. Empty-state contract adoption

**Reason**: If the entry path is still confusing, downstream feature polish will not fix activation failure.

### Sequence 2: Core execution loop

1. Board and task detail reprioritization
2. Sprint planning and DSU review separation
3. Inbox triage clarity

**Reason**: These surfaces define the day-to-day product loop.

### Sequence 3: Intelligence and multi-view credibility

1. Schedule intelligence live/scenario split
2. Dashboard metric semantics
3. Table/timeline/calendar consistency and mobile behavior

**Reason**: Users must first trust the workflow before they can trust summaries and predictions built on top of it.

### Sequence 4: Cross-cutting polish and regression hardening

1. Language and design-system cleanup
2. Telemetry and regression safety
3. Final mobile and empty-state sweep

## Test Strategy

### Frontend unit and component tests

- Shell visibility and role/scope behavior
- Activation surface primary CTA priority
- Empty-state rendering contract
- Board state hierarchy and detail prioritization
- Sprint mode switching and DSU lock messaging
- AI guidance state rendering (`not_run`, `evaluated`, `fallback`, `unavailable`, `low_confidence`)
- Dashboard metric label-to-drilldown matching
- Inbox triage card context rendering

### Integration and interaction tests

- First-session path from sign-in to first meaningful action
- Workspace selection before destination selection
- Shared filter continuity across board/table/timeline/calendar/dashboard
- DSU submit -> review -> approval pending behavior
- Insights live mode vs scenario mode switching

### Mobile and accessibility checks

- 360px and 390px widths for activation, board, sprint, inbox, insights
- Keyboard access to primary actions and major navigation
- Focus visibility on dialogs, drawers, and explicit AI entry surfaces
- No page-level horizontal scroll in core flows

### Backend support validation

- Existing gateway support remains stable for affected UI states
- No semantic mismatch between metrics displayed and underlying returned objects
- No UI requirement pushes service logic outside declared boundaries

## Rollout Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Shell simplification hides familiar shortcuts for advanced users | Medium | Keep advanced controls discoverable through progressive disclosure rather than removal |
| Activation simplification conflicts with existing backend profile-completion assumptions | High | Treat profile gating as an explicit implementation task with fallback behavior and acceptance coverage |
| Insights redesign still feels untrustworthy if metric semantics lag | High | Implement metric/drilldown contract before visual polish on intelligence pages |
| Mobile fixes regress desktop density | Medium | Use route-specific responsive behavior, not global downsizing |
| Copy consistency drifts across surfaces | Medium | Maintain a vocabulary map and include it in implementation tasks and review checklist |
| Existing AGENTS/feature scripts assume one spec per numeric prefix | Low | Use the current branch path explicitly during planning and note the prefix-collision warning for future cleanup |

## Deliverables Created by This Plan

- `/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/plan.md`
- `/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/research.md`
- `/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/data-model.md`
- `/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/quickstart.md`
- `/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/contracts/ui-surface-contract.md`

## Ready for Phase 2

This feature is ready for `/speckit.tasks`.
The next step should decompose the workstreams above into ordered, testable implementation tasks with explicit file targets and acceptance checks.
