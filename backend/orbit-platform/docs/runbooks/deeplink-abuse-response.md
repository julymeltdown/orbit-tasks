# Deep-Link Abuse Response Runbook

## Detection Signals

- `orbit_deeplink_auth_required_total` spike
- repeated invalid token resolution attempts
- sudden burst from narrow source IP range

## Containment

1. Increase deep-link token validation logging level.
2. Apply temporary rate limit for `/dl/{token}` and `/api/deeplinks/*/resolve`.
3. Block abusive IP ranges at edge/WAF if confirmed malicious.

## Validation Steps

1. Sample recent token requests for token entropy and replay pattern.
2. Verify tokens are fixed to internal paths only.
3. Check whether expired/consumed tokens are being reused.

## Recovery

1. Rotate token issuance secret strategy if applicable.
2. Force invalidate suspect token cohorts by creation window.
3. Re-run auth-bounce regression test scenarios.

## Follow-up Hardening

- shorter TTL for high-risk link categories
- CAPTCHA/step-up auth for repeated invalid attempts
- anomaly detector threshold tuning
