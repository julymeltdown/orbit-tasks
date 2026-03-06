# Research: Frontend Usability Overhaul

## Decision 1: Navigation must be scope-first, not feature-first

**Decision**: Use the left-side primary navigation only for scope and major work areas, and keep project view switching inside the current project surface.

**Rationale**:
- The current app asks users to interpret both scope changes and representation changes from competing navigation regions.
- Users need to know whether they are moving to a different place or merely changing how the same work is viewed.
- This matches the product promise that board, table, timeline, calendar, and dashboard are alternate views over the same work.

**Alternatives considered**:
- Keep both left navigation and project-view navigation visible with similar prominence: rejected because it preserves the current control-plane conflict.
- Move all project views into global navigation: rejected because it breaks the shared-context mental model.

## Decision 2: Only one primary AI assistance entry point can compete for attention at a time

**Decision**: Deep AI interactions will have one active entry point per context. The global assistant remains explicit and user-invoked, while page-level AI summaries are passive unless the page itself is the dedicated intelligence surface.

**Rationale**:
- The current app splits attention across the right rail, the insights page, and the floating widget.
- Users cannot form a reliable mental model when multiple AI surfaces appear to offer overlapping control.
- A single active AI trigger improves trust and reduces noise without removing guidance.

**Alternatives considered**:
- Keep persistent rail, floating widget, and page AI panels all active: rejected because it preserves duplicated affordances.
- Remove cross-app AI entry entirely and keep insights-only AI: rejected because the product still needs contextual assistance during execution.

## Decision 3: First-session activation should require only minimum identity completion

**Decision**: Block entry only on identity-critical profile information and defer optional enrichment such as avatar and rich bio to a non-blocking flow.

**Rationale**:
- First-use friction is currently too high for a task product.
- Optional profile fields do not justify blocking workspace entry.
- Early value delivery depends on getting users into tasks, workspace selection, and collaboration quickly.

**Alternatives considered**:
- Keep all current profile fields mandatory before entry: rejected because it delays first value and increases abandonment risk.
- Remove profile completion entirely: rejected because collaboration still benefits from a stable visible identity.

## Decision 4: Workspace selection must be a scope decision before it is a destination decision

**Decision**: The workspace entry flow should first answer “which workspace am I in?” and only then offer the recommended next destination.

**Rationale**:
- The current flow exposes multiple destinations before the user has confidently established scope.
- Scope ambiguity makes downstream navigation and permission behavior harder to understand.
- A scope-first pattern better supports multi-workspace users and role-based access.

**Alternatives considered**:
- Let users open any destination from the workspace list immediately: rejected because it front-loads too many choices.
- Auto-enter the first workspace without explanation: rejected because it hides context and can surprise multi-workspace users.

## Decision 5: Board is the default execution surface and must behave like an execution tool, not a control dashboard

**Decision**: The board will prioritize one operational action path: create, inspect, move, and update work. Secondary controls will be progressively disclosed.

**Rationale**:
- The board is the daily-use surface and should privilege execution over configuration.
- Too many adjacent controls weaken scanability and increase hesitation.
- A stable board-plus-contextual-inspector model supports both speed and detail.

**Alternatives considered**:
- Keep all secondary panels and controls equally visible: rejected because it preserves the current cognitive density.
- Collapse all secondary detail into separate pages: rejected because that increases navigation overhead.

## Decision 6: Sprint planning and DSU review are separate modes in one workflow

**Decision**: Keep sprint and DSU in the same domain area but divide them into distinct modes with explicit mode labels, prerequisites, and handoff states.

**Rationale**:
- Planning and review are related, but they are not the same user task.
- Users need to know when they are preparing work versus reviewing and approving daily execution updates.
- A single route with explicit modes preserves continuity while reducing confusion.

**Alternatives considered**:
- Keep both panels mixed in one screen without stronger separation: rejected because users cannot infer sequence or responsibility.
- Split sprint and DSU into unrelated sections of the app: rejected because it breaks the intended loop.

## Decision 7: Schedule Intelligence must separate live telemetry from scenario editing

**Decision**: The intelligence surface will have explicit live-data and scenario modes, with visible labeling of which metrics are observed and which are hypothetical.

**Rationale**:
- Editable metrics on a diagnostic screen undermine trust if users cannot tell whether they are looking at real data.
- The product needs both monitoring and simulation, but the modes must not visually blur together.
- This separation improves explainability and metric credibility.

**Alternatives considered**:
- Keep current inline-editable metrics as the default surface: rejected because it invites misinterpretation.
- Remove scenario editing entirely: rejected because planning and coaching still need “what-if” exploration.

## Decision 8: Dashboard and insight metrics need semantic contracts

**Decision**: Every metric presented to users must have a clearly defined business meaning and a drilldown that matches that meaning.

**Rationale**:
- If labels and underlying counts do not match, the dashboard becomes untrustworthy.
- Metric trust is especially important in the same product that offers AI guidance.
- Semantic contracts reduce accidental regressions in future UI iterations.

**Alternatives considered**:
- Leave metric meaning implicit in implementation: rejected because it already produced misleading summaries.
- Avoid drilldowns: rejected because users need verification paths.

## Decision 9: Inbox triage requires rich context, not bare event rows

**Decision**: Inbox items must carry a readable preview, urgency framing, source object context, and the recommended next action.

**Rationale**:
- Notification value comes from reducing decision time.
- Low-context inbox rows force blind clicking and increase interrupt cost.
- Triage quality depends on understanding what changed and why it matters before opening a thread.

**Alternatives considered**:
- Keep source/type/status only: rejected because it is too thin for operational triage.
- Turn Inbox into a pure chat feed: rejected because it would bury actionability.

## Decision 10: Responsive behavior must prevent page-level horizontal scrolling in core flows

**Decision**: Mobile-sized layouts will prefer stacking, summarization, or mode switching over forcing users into page-level horizontal scroll.

**Rationale**:
- Board, table, and timeline currently lean heavily on desktop width assumptions.
- Horizontal page scroll makes dense workflow tools feel brittle and amateur.
- The product can still use dense layouts on desktop while giving mobile users narrower task-focused modes.

**Alternatives considered**:
- Allow all project views to remain wide with touch scrolling: rejected because it fails the product’s mobile usability goals.
- Build mobile-only routes for every surface: rejected because it would create excessive duplication.

## Decision 11: Product vocabulary must be Korean-first and concept-stable

**Decision**: User-facing copy will use a consistent Korean-first vocabulary across activation, execution, sprint, inbox, and intelligence surfaces, while hiding raw enum or implementation names.

**Rationale**:
- The current mix of Korean and English labels feels inconsistent and unfinished.
- Stable terminology reduces relearning cost and improves perceived quality.
- The target operator context is Korean-speaking, so the interface should reflect that consistently.

**Alternatives considered**:
- Keep mixed-language labels where convenient: rejected because it preserves current inconsistency.
- Translate everything including domain-critical proper nouns: rejected because some domain terms are clearer when preserved selectively.

## Decision 12: Empty states are instructional surfaces, not passive gaps

**Decision**: Every major empty state must declare the page purpose, current absence reason, primary next action, and optional learning path.

**Rationale**:
- Empty states are currently one of the main failure points for novice learnability.
- The first useful action is often chosen from an empty page.
- Consistent empty-state contracts provide a reusable quality floor across the app.

**Alternatives considered**:
- Treat empty states as cosmetic placeholders: rejected because they do not improve activation or recovery.
- Write page-specific empty states without a shared contract: rejected because it invites drift.
