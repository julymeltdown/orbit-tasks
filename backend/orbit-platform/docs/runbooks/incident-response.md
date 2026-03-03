# Incident Response Runbook

## Trigger Conditions

- API gateway 5xx > 2% for 10 minutes
- schedule evaluation fallback ratio > 25% for 15 minutes
- severe authentication failures across workspace entry

## First 15 Minutes

1. Declare incident in operations channel and assign incident commander.
2. Identify scope:
   - affected endpoint(s)
   - affected workspace(s)
   - first seen timestamp
3. Freeze risky deployments and migrations.
4. Capture baseline telemetry:
   - gateway error rate
   - dependency latency
   - queue depth / retry metrics

## Stabilization Actions

1. Enable degraded mode where applicable:
   - schedule evaluation fallback rules-only mode
   - disable non-critical background jobs
2. Apply traffic controls:
   - tighten per-client rate limits
   - block abusive source patterns
3. Roll back recent suspect deployment if correlation confirmed.

## Communication

- 30-minute cadence updates to stakeholders
- Include scope, mitigation, ETA, and next checkpoint

## Recovery Verification

1. Validate key user flows:
   - login/workspace entry
   - thread/mention/inbox
   - schedule evaluation endpoint
2. Check SLO metrics normalize for at least 30 minutes.
3. Close incident and schedule postmortem within 48 hours.

## Postmortem Template

- Timeline
- Root cause
- Detection gaps
- Permanent fixes
- Owners and due dates
