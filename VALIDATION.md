# Validation status

- Next.js production build: passed.
- TypeScript: passed.
- Automated integration check: passed (`pnpm test`). It uses an isolated temporary SQLite/libSQL database, initializes migrations twice, confirms empty business tables and zero balance, and checks deposits, idempotency, reversals, concurrent stock, Member authorization, proof storage, CSV and rate limiting.
- Hosted Vercel and remote Turso validation: pending account connection and database provisioning.
- Live Discord delivery: not tested; needs webhook configuration.
