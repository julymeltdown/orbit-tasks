# Migration Operations Runbook

## Preconditions

1. Source system access validated (OAuth/token scope)
2. Mapping preview passed with no blocking errors
3. Rollback snapshot generation enabled
4. Change window approved for production migrations

## Execution Steps

1. Run import preview and review warnings.
2. Capture baseline metrics and record migration ticket ID.
3. Execute import job and monitor progress until `completed`.
4. Validate data integrity:
   - item counts
   - status mapping
   - owner/date field mapping

## Rollback Procedure

1. Trigger `/imports/{jobId}/rollback`.
2. Verify rollback status is `rolled_back`.
3. Reconcile post-rollback counts with pre-import baseline.
4. Document deviation and residual cleanup tasks.

## Failure Handling

- If preview fails: stop and correct mapping.
- If execute partially fails: do not rerun blindly; inspect snapshot and idempotency keys first.
- If rollback fails: open Sev2 incident and freeze further imports.

## Evidence to Preserve

- preview report JSON
- execution and rollback job IDs
- validation screenshots/metrics
- stakeholder approval references
