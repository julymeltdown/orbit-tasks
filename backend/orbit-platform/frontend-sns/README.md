# frontend-sns

Next.js frontend for the social app.

Last updated: 2026-02-19

## Runtime

- Next.js 16
- React 19
- TypeScript 5

## Commands

```bash
npm install
npm run dev      # localhost:5174
npm run build
npm run start
npm run test
npm run lint
```

## Environment

Required in production/build environments:
- `NEXT_PUBLIC_API_BASE_URL` (example: `https://tasksapi.infinitefallcult.trade`)

Optional:
- `GATEWAY_PROXY_TARGET` (used by deployment manifests)

## Notes

- This frontend is designed to call the API gateway REST endpoints.
- For local development, run backend services first (see root `README.md`).
