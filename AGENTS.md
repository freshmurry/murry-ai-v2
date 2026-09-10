# MurryAI — Base44 Dev Environment

## What this is
A Cloudflare Workers app (MurryAI) — agentic proposal intelligence platform. Single Worker serves both the React SPA (from `public/index.html` via the ASSETS binding) and the REST/WebSocket API (`src/index.ts`). Runs locally via `wrangler dev`.

## How to run
```bash
docker compose -f docker-compose.base44.yml up -d
```
- App is on **port 3000** (mapped from wrangler dev's `--port 3000`).
- Health check: `GET /health` → `{"status":"ok",...}`

## Architecture notes
- All Cloudflare bindings (D1, KV, Vectorize, Durable Objects, Workflows, AI, Assets) live under `[env.production]` in `wrangler.toml`. Dev must use `--env production` to get them.
- `scripts/dev-startup.sh` handles: npm install → `.dev.vars` creation → D1 migrations → wrangler dev.
- A dev-specific `wrangler.dev.toml` is generated at startup by stripping the `[env.production.ai]` binding. The AI binding runs in "remote" mode and requires `CLOUDFLARE_API_TOKEN`; removing it lets wrangler start without Cloudflare creds. AI-powered features (embeddings, RAG search, agent chat via Workers AI) won't work locally without it.
- Vectorize is "not supported" in local dev — code has guards (`if (!env.VECTORIZE || typeof env.VECTORIZE.query !== 'function')`) so it degrades gracefully.
- R2 binding (`DOCUMENTS_BUCKET`) is commented out in `wrangler.toml` — document upload/download will error. Re-enable for local dev by uncommenting `[[env.production.r2_buckets]]`.
- D1 migrations: `migrations/001_init.sql`, `002_proposals.sql`, `003_auth_multitenant.sql` — applied automatically on startup (idempotent with `CREATE TABLE IF NOT EXISTS`).

## Secrets
- `ANTHROPIC_API_KEY` — powers Claude-based agentic chat/proposal features. A dev placeholder is generated so the app boots; replace with a real key from console.anthropic.com for AI to work.
- `JWT_SECRET` — has a code fallback (`'fallback-jwt-secret-key-change-in-production'`); a dev placeholder is written to `.dev.vars`.

## Key files
- `src/index.ts` — main Worker entry, router, re-exports DO/Workflow classes
- `src/api/handlers.ts` — REST API handlers (projects, documents, QA, brain, etc.)
- `src/api/auth-handlers.ts` — auth (register, login, JWT)
- `src/agents/ProposalAgent.ts` — agentic loop with Claude tool use
- `src/lib/rag.ts` — RAG pipeline (embed → search → rerank → context)
- `public/index.html` — React SPA (single file, Tailwind via CDN)
