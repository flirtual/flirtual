# Flirtual — project instructions

Shared, cross-app context for the monorepo; per-app details live in each app's own CLAUDE.md
(linked below). For work spanning both apps (API contract changes, the image pipeline, anything
crossing the frontend/API boundary), load this file plus each relevant app's CLAUDE.md first.

## Overview

Flirtual is a dating app for VR users. The monorepo contains:

- **Frontend** (apps/frontend/): TypeScript/React Router SPA on Cloudflare Workers. See [apps/frontend/CLAUDE.md](apps/frontend/CLAUDE.md) for stack, commands, styling, patterns, translations.
- **API** (apps/api/): Elixir/Phoenix; data, auth, business logic. See [apps/api/CLAUDE.md](apps/api/CLAUDE.md) for stack, commands, patterns, matchmaking, moderation, schema, prod/DB ops.

Other services:
- **image-classification/**: TensorFlow image moderation (NSFW/inappropriate).
- **session-transfer/**: carries a logged-in session across the flirtu.al → flirtual.com migration via a single-use, API-minted token.
- **trace/**: trace-forwarding proxy with loop detection.
- **grafana/** + **tempo/**: tracing and metrics (Tempo OTLP backend, Grafana UI).

## Data flow

Frontend → `/v1/*` (wretch) → Phoenix router (`lib/flirtual_web/router.ex`, auth pipelines) →
controllers → context modules → Ecto. Oban runs async/scheduled work (email/push, TalkJS/Listmonk
sync, session/account pruning).

## Environment

```sh
# Commands needing local env + secrets (run in apps/api or apps/frontend)
source .env.local
bws run --project-id $BWS_PROJECT_ID -- [command]   # e.g. `iex -S mix phx.server`, `pnpm dev`
```

Per-app build/run/deploy commands live in each app's CLAUDE.md.

## Image uploads

Cross-app pipeline (frontend Worker + API + image-classification):

1. **Upload** (`InputFile`/Uppy): direct to R2 (`uploads.flirtual.com`, S3 API); returns object key, which the frontend sends to the API.
2. **API** (`Flirtual.User.Profile.Image`): creates a `profile_images` row (`scanned: false`); an R2 notification queues processing.
3. **Processing** (`apps/frontend/src/worker/image-queue.ts`): generates variants (Cloudflare Images/sharp) back into R2, then queues classification.
4. **Classification** (`apps/image-classification/`): returns moderation results; API sets `scanned: true`; flagged images ping moderators via Discord webhook.

R2 layout: originals at `uploads.flirtual.com/[key]`, variants at `[key]/[variant].jpg` (`thumb`, `icon`, `avatar`).

## Development workflow

- **Backend**: edit Elixir (hot reload) → `mix check` → test with curl.
- **Frontend**: edit TS/React (hot reload) → `pnpm tsc` → test manually.
- **Database**: `mix ecto.gen.migration` → edit → `mix ecto.migrate` (no rollbacks).
- **API contract**: update the controller and frontend client together.
