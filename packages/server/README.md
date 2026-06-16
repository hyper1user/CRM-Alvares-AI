# @alvares/server

Phase 0 server skeleton for the future AlvaresAI sync flow.

Current scope:

- local HTTP server without external runtime dependencies
- `GET /health` readiness endpoint
- typed config via `ALVARES_SERVER_HOST` and `ALVARES_SERVER_PORT`
- type-only probe against `@alvares/shared/ipc-channels`

Default endpoint:

```txt
http://127.0.0.1:3780/health
```

This package intentionally does not include auth, database writes, sync jobs, or client integration yet. Those belong to the next phases after UUID and data-flow decisions are locked.
