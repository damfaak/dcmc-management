# DCMC on Vercel

React client → Next.js route handlers on Vercel Node.js → remote libSQL/Turso.

PINs are PBKDF2-hashed with random salts. Session tokens are opaque and stored hashed in the database. HTTP-only same-site cookies and same-origin mutation checks remain enabled. Vercel's platform-owned forwarded IP is used for the login rate limit; arbitrary client IP headers are not trusted. Role checks occur on every API operation.

Every financial/stock operation writes its ledger, derived tables, inventory count and notification outbox in one libSQL transactional batch. Stock has a nonnegative CHECK constraint. Reversals retain immutable history. Idempotency keys prevent duplicate form submissions.

Proof images (up to 3 MB) live in proof_files and are read through an authorized API route. This avoids a separate storage service for the initial small internal deployment. Larger file volumes should use private object storage later.

Only schema and initial access configuration are initialized. No business data is seeded. Remote schema is applied through scripts/migrate.mjs. Vercel is not permitted to use a local SQLite file for production persistence.

The existing Sites deployment is independent and remains unchanged. There is no proxy or dependency on its API.
