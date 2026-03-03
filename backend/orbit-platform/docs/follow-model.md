# Follow Model Design

## Goal
Move from mutual "friend" relationships to a one-way follow graph with cursor pagination,
fast counts, and clear scaling paths for high-volume accounts.

## API Surface
- Follow: `POST /api/follows` (body: `targetUserId`)
- Unfollow: `DELETE /api/follows/{targetUserId}`
- List followers: `GET /api/follows/followers?userId=&cursor=&limit=`
- List following: `GET /api/follows/following?userId=&cursor=&limit=`
- Counts: `GET /api/follows/counts?userId=`
- Status: `GET /api/follows/status?targetUserId=`

## Data Model
- FollowEdge: `(follower_id, followee_id, created_at)`
- Uniqueness: `(follower_id, followee_id)` must be unique (idempotent follow)

## Pagination
- Cursor = `created_at|tie_key` where tie_key is `follower_id` or `followee_id`
- Ordered by `created_at DESC, follower_id ASC, followee_id ASC`
- `nextCursor` returned when page size == limit

## Consistency and Concurrency
- Follow is idempotent: duplicate follows return existing edge
- Unfollow is idempotent: remove if present, otherwise no-op
- In DB-backed implementations, prefer:
  - `INSERT ... ON CONFLICT DO NOTHING` for follow
  - `DELETE ... WHERE follower_id=? AND followee_id=?` for unfollow
- Use transactions to update counts and edge insert/delete atomically

## Counts and Hot Users
- Maintain follower/following counters separately (avoid O(n) scans)
- For very popular users:
  - Sharded counters or Redis `INCRBY` with periodic reconciliation
  - Cache counts for short TTLs to absorb spikes
  - Paginate follower lists with tight limits and rate limiting

## N+1 Avoidance
- Follow APIs return only user IDs
- Frontend batches profile lookups via `/api/profile/batch`

## Current Implementation Notes
- In-memory repository (local/test) keeps:
  - Edge map, followers/following ordered sets
  - Counter maps for O(1) counts
  - Read/write lock for consistency

## Future Extensions
- Persist edges in a relational DB with proper indexes
- Add async fan-out or materialized views for heavy read paths
- Optional privacy controls (private accounts, follow requests)
