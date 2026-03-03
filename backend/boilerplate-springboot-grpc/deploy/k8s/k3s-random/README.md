# k3s-random Deployment Notes

Namespace: `boilerplate-random`

Last updated: 2026-02-19

## Purpose

This directory contains a full k3s deployment set for:
- auth/profile/friend/notification/post services
- api-gateway
- frontend-sns
- kafka
- redis
- dedicated `post-postgres`

## Apply

Use image placeholders from `image-tags.env` and apply all manifests.

```bash
cd deploy/k8s/k3s-random
set -a
source image-tags.env
set +a

for f in $(ls *.yaml | grep -v '^kustomization.yaml$'); do
  envsubst < "$f" | kubectl apply -f -
done
```

If you use kustomize:

```bash
kubectl apply -k deploy/k8s/k3s-random
```

## Important Ports (current manifest values)

- Frontend NodePort: `32612`
- API Gateway NodePort: `32391`

Cluster-internal services expose both HTTP and gRPC where applicable.
Check each `*-service.yaml` for exact container/service ports.

## Notes

- `post-service` is configured to use `post-postgres` in this deployment set.
- `kafka`/`redis` are included for eventing/caching paths.
- Update `image-tags.env` before each redeploy.
