# Quickstart: Frontend Usability Overhaul

## Purpose

Use this guide to validate the redesigned frontend usability behavior once implementation begins. It covers setup, manual walkthroughs, and the minimum automated checks expected for this feature.

## Local Setup

### Frontend

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
npm install
npm run dev
```

### Frontend quality checks

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
npm run lint
npm test
npm run build
```

### API Gateway (for integrated UI verification)

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway
./gradlew test
./gradlew bootRun
```

## Environment

Frontend expects a reachable API base URL.

Example local environment:

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
cp .env.example .env.local
```

Ensure `VITE_API_BASE_URL` points to a valid gateway instance before integrated UI testing.

## Manual Verification Flows

### 1. First-session activation

1. Sign in with a user who has no prior active workspace state.
2. Open `/app`.
3. Verify the page explains its purpose and presents exactly one dominant primary action.
4. Verify optional profile enrichment does not prevent workspace entry.

### 2. Workspace selection

1. Open `/app/workspace/select`.
2. Verify the user chooses workspace scope before seeing a spread of destination actions.
3. Verify the system shows why the chosen workspace is relevant and what the recommended next destination is.

### 3. Board execution

1. Open `/app/projects/board`.
2. Verify current scope and sprint state are understandable within the first viewport.
3. Create one work item.
4. Select the item and confirm the inspector shows current state and next action before secondary metadata.

### 4. Sprint and DSU loop

1. Open `/app/sprint?mode=planning`.
2. Confirm planning purpose and next step are explicit.
3. Move to `/app/sprint?mode=dsu`.
4. Verify lock or prerequisite messaging is understandable when the plan is not ready.
5. Submit a DSU and confirm suggestions are readable and clearly pending approval.

### 5. Schedule intelligence

1. Open `/app/insights`.
2. Confirm whether the page is in live mode or scenario mode.
3. Run an evaluation.
4. Verify draft guidance shows confidence, rationale, and draft status.
5. Trigger or simulate fallback and confirm the message explains the difference.

### 6. Inbox triage

1. Open `/app/inbox`.
2. Confirm each item has preview, urgency, source context, and clear next action.
3. Open the linked discussion or source work item.
4. Resolve the item and verify the state change is explicit.

### 7. Cross-view consistency

1. Apply filters in board view.
2. Switch to table, calendar, timeline, and dashboard.
3. Confirm scope and filter context remain consistent unless explicitly reset.

### 8. Responsive verification

1. Test at 360px width and 390px width.
2. Run the core flows above.
3. Confirm no page-level horizontal scrolling is required in activation, board access, sprint mode switching, inbox triage, and insights review.

## Minimum Acceptance Evidence

Collect the following before implementation is considered ready:

- Screen recordings for first-session activation, workspace selection, board execution, sprint/DSU, insights, and inbox flows
- Before/after screenshots for empty states and blocked states
- Test evidence for mobile width verification
- Notes from at least one manual drilldown validation showing metrics align with their underlying work

## Suggested Regression Commands

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web && npm run lint && npm test && npm run build
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway && ./gradlew test
```
