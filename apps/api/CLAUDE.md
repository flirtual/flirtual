# Flirtual API

Part of the Flirtual monorepo; see the [root CLAUDE.md](../../CLAUDE.md) for the overview, data
flow, and environment setup.

## Stack

- **Framework**: Phoenix 1.7 (Bandit)
- **Database**: PostgreSQL (Ecto)
- **Matchmaking**: Manticore
- **Jobs**: Oban
- **i18n**: Gettext
- **Auth**: token in the Plug session cookie; email/username+password, passkey (WebAuthn), OAuth; email verification for new login locations; JWT for confirmation links and Canny SSO.
- **Push**: APNS + FCM via Pigeon; tokens synced to TalkJS (which sends message notifications).
- **Integrations**: Chargebee (web pay), RevenueCat (mobile pay; Stripe deprecated), TalkJS (messaging), Listmonk (newsletters), VRChat (worlds/invites), OpenAI (bio moderation, translating mod messages).
- **Key contexts**: `User.*`/`Users`/`Profiles` (profiles, auth, notifications); `Matchmaking`/`Search` (queue, Manticore via Ecto/MyXQL); `Talkjs`/`Conversation` (messaging); `Flag`/`Hash`/`Disposable`/`IpAddress`/`OpenAI`/`Turnstile` (moderation/security); `Subscription`/`Plan`/`Chargebee`/`RevenueCat` (payments); `Connection` (OAuth).

## Commands

```sh
cd apps/api

mix phx.server                 # dev server (prefix `iex -S` for a shell)
mix ecto.migrate               # run migrations (no rollbacks; see priv/repo/migrations/)
mix ecto.gen.migration [name]  # new migration
mix format                     # format
mix credo                      # static analysis
mix check                      # format + credo + compile
mix compile / mix clean        # build / clean artifacts
mix gettext.extract --merge    # extract translatable strings
```

## Patterns

- **Utilities**: check `lib/flirtual/utilities.ex` (domain) and `lib/flirtual_web/utilities.ex` (web/HTTP) before adding one; put reusable helpers there.
- **Authorization**: Bodyguard policies (e.g. `Flirtual.User.Profile.Policy`); always check them. Rate-limit spam/security-risk endpoints with `ExRated` (by IP or user id).
- **Changesets**: Ecto changesets validate and transform.
- **Jobs**: Oban workers in `lib/flirtual/oban_workers/`, configured in `config/runtime.exs`.
- **Sessions**: `FlirtualWeb.Session`. **Errors**: `FlirtualWeb.ErrorHelpers`.

## Matchmaking

Two modes, each with its own queue:
- **Date** (`:love`): dates; full filters/factors, Like button.
- **Homie** (`:friend`): friends; no gender/age filters, mostly random order, Homie button.
- Switching modes keeps the viewed profile (`?user=`) so you can Like a Homie-found profile or Homie a Date-found one. A `love` like plus a `friend` like still matches (as `:friend`).

### Search (Manticore)

`Flirtual.Search` (`lib/flirtual/search/`) runs over Manticore via the MySQL protocol (`Search.Repo`, Ecto/MyXQL, port 9306, `query_type: :text`; prepared-statement support is partial). One `profiles` table holds profile content only, created by `Search.bootstrap/0` on boot; `Search.reindex_all/0` rebuilds it from Postgres (nothing there needs preserving). Gotcha: Manticore `int` is unsigned, so any possibly-negative column must be a signed `bigint`.

`Matchmaking.Query` builds the query as data (hard filters + weighted factors, no SQL); `Search.compile/1` emits one SphinxQL statement, centralizing id hashing and formatting. Factors match namespaced tokens in the `boosts` field (`attr:`, `lf:`, `cust:`, `lang:`, `rel:`, `country:`, `monopoly:`, `domsub:`).

### Exclusions

The index holds no relationship state. `Query.build/3` reads the user's exclusion set (like/pass targets plus blocks both ways) and liked-me set from Postgres and inlines both per query: exclusions as `id NOT IN (...)`, the liked-you boost as `IN(id, <likers>) * like_multiplier`. Manticore parses tens of thousands of inline ids in single-digit ms, and queries only run from async recomputes, so there's no sync, staleness, or reconciliation: a like/undo/block/unblock lands on the next recompute. `like_multiplier` (candidate pickiness) is the one derived document column, computed from Postgres at index time and refreshed each recompute.

### Queue lifecycle

1. **Recompute**: Oban (`ObanWorkers.ComputeQueue`, `matchmaking` queue, unique per user+kind). Triggered when ≤5 uncompleted prospects remain, on profile/preference/filter updates, or after the daily reset while serving fallback. Protected rows survive: current head, next 2, and last completed prospect (undo anchor). Preference/filter updates first prune to current profile + undo anchor (`Matchmaking.refresh_queues/2`) so free users can't farm profiles.
2. **Prospects** (`prospects`): ordered by `position`; `completed_at` marks acted rows; `fallback` marks relaxed results (primary always sorts first).
3. **Fallback** (Date only): when hard filters run dry, age + advanced filters relax into soft factors (age closeness, advanced as boosts); gender stays mutual. Response carries `notice: "fallback"` until dismissed (`DELETE /v1/queue/notice`); re-arms only on filter updates (`queues.fallback_notified_at` vs `filters_updated_at`).
4. **Endpoint** (`GET /v1/queue?mode=`): returns `{previous, next: [≤3 ids], fallback, notice, limits, can_undo, pending}`. Frontend renders previous/current/next optimistically and polls while `pending`.
5. **Like/Pass** (`POST /v1/queue {type, mode, user_id}`): `kind` == `mode`; any readable target works (cross-mode/guest profiles get a prospect row on the spot so undo works). Completes the prospect in the acted mode, deletes it from the other. Respond txn is DB-only; on match, `ObanWorkers.ProcessMatch` creates the TalkJS conversation and notifies afterward (fast match popup).
6. **Undo** (`DELETE /v1/queue?mode=`): restores the last completed prospect to the head and deletes its `likes_and_passes` row (refunding limits). One undo in a row (`queues.undone`, re-armed by the next action); undoing a match enqueues TalkJS participant cleanup.
7. **Likes You**: unrequited likes (they liked you, you haven't responded); blurred avatars for free users; responds via the same `POST /v1/queue`.

### Hard filters

Date primary query: gender is the only mutual filter (candidate matches my preference AND is looking for my gender); my age range is a hard filter on candidates, but whether I'm in their range is a scoring factor; my advanced filters are hard (not mutual). Homie ignores gender/age/advanced entirely (age closeness is a factor instead).

### Advanced filters (`profile_advanced_filters`, Date only, Premium-gated)

Per-category include/exclude tag lists: gender, sexuality, interest, game, platform (attribute-backed), country, language (value-backed). The dropdown (`advanced-filter-select.tsx`) groups options under fixed-order headings (VR platforms, accessories, language, country, gender, sexuality, looking-for, relationship-type, popular interest, interest, game, personality, role, kink) with jump chevrons and a Premium badge on gated groups. Options keep their `order`; "only want to see" hoists the user's own tags to the top (except accessory/gender); typing flattens the list and appends the category per tag. "Popular interest" = the Popular interest-category; VR platforms/accessories split via platform `metadata.kind`. Looking-for (relationships), relationship-type (monopoly), personality (Big Five poles, from openness/conscientiousness/agreeableness signs) and role (domsub, NSFW) are value-backed, matched against `boosts` tokens; all four are Premium. Free users get genders, languages, Popular-category interests, and VR platforms (headset-kind); everything else is Premium. Editing bumps `queues.filters_updated_at` and refreshes both queues, keeping the current profile on top.

### Scoring factors (Date, base weight × Premium custom weight)

Likes-you 20, interests 3/5/20 by strength, custom interests 25, games 1, location composite 40 (country/geo/timezone rescaled, plus same-country compensation when geo/timezone missing), monopoly 5, relationships 2, domsub 3 (NSFW), languages 1, kinks 2 (NSFW), personality 4.5×3 traits, reverse-age 10 (candidate's range includes me: full inside, halving per 5 years outside), activity decay 12, random 1. Homie: likes-you, interests, custom interests, games, languages, personality, age closeness 15 (full inside my range, halving per 5 years outside) + reverse-age 10, activity, random 15.

### Daily limits (non-subscribers, per mode, counters on `queues`)

- Browses (like/homie + pass) 30/day; likes/homies 15/day (lazy reset 9am UTC via `queues.reset_at`; errors `out_of_browses`/`out_of_likes`).
- Blocking a queued prospect spends a pass in each queue they appeared in.
- Incomplete profiles (not visible to others): 15 browses / 7 likes total across modes, lifetime (`users.likes_count/passes_count`, not undo-refunded).
- Premium is unlimited; undo refunds the daily counters.

## Moderation

- **Reports** (`Flirtual.Report`): predefined reasons + optional message/images; `/reports` (mods/admins); auto-shadowban after several reports, lifted on clear.
- **User search**: `/search` (mods/admins); search/sort/filter by user properties.
- **Actions**: ban (`suspended_at`, can't log in, profile hidden); shadowban (`indef_shadowbanned_at`, hidden from matchmaking, app still usable); warn (`warned_at`, message shown, optionally shadowbanned until acknowledged); payments ban (`payments_banned_at`); note (mod-only).
- **Flags** (`Flirtual.Flag`): keyword/phrase patterns for bios/names/custom interests, AI bio flags, disposable/blocked/flagged email domains, registration honeypot; run on profile updates via `Flag.check_profile_flags/2`.
- **Hashes** (`Flirtual.Hash`): track prior usernames, display names, Discord/VRChat connections, IPv4, IPv6 /48 blocks, devices, etc. to catch duplicates/ban evasion.
- All of the above notify via Discord webhook.

## Database schema

Key tables:
- **users**: email, password hash, status, timestamps, platform tokens (APNS/FCM), activity.
- **profiles** (1:1 users): display name, bio, custom interests, personality, queue counters.
- **profile_images**: image metadata + moderation status (R2-stored).
- **profile_attributes**: profile ↔ attribute junction (gender, interests, games, kinks, ...).
- **profile_preference_attributes**: "looking for" attributes.
- **preferences** / **preferences_email_notifications** / **preferences_push_notifications** / **preferences_privacy**: account, email, push, privacy settings.
- **profile_preferences**: matchmaking prefs (age range, etc.).
- **profile_custom_weights**: per-factor importance multipliers.
- **profile_advanced_filters**: per-category include/exclude filters.
- **attributes**: lookup for all attributes (type, name, metadata).
- **likes_and_passes**: responses (type like/pass, kind love/friend).
- **prospects**: precomputed queue (position, completed_at, fallback).
- **queues**: per-user-per-mode state (recompute timestamps, fallback notice, undo latch).
- **blocks**: user blocks.
- **connections**: OAuth connection metadata (Discord, VRChat, Google, Apple, ...).
- **sessions**: active sessions + tokens. **user_passkeys**: WebAuthn credentials. **logins**: attempt history. **verifications**: email codes for new login locations.
- **reports**: reasons, messages, evidence images. **flags**: keyword/domain patterns. **hashes**: historical hashes for duplicate detection.
- **profile_prompts**: prompt responses.
- **subscriptions**: Chargebee/RevenueCat data (Stripe deprecated). **plans**: available plans.

## Production

### API

Fly app `flirtual` at `https://api.flirtu.al` (not `.com`); routes under `/v1` (`lib/flirtual_web/router.ex`).

Health: `GET /v1/health?check=<type>` where `<type>` is `api`, `database`, `matchmaking`, or `notifications` (default `api`); returns `200 {"status":"ok"}` or `503 {"status":"error"}`. A down dependency is 503, not 500: `database`/`notifications` hit `Repo` and rescue `DBConnection.ConnectionError`; `matchmaking` hits Elasticsearch via Snap (error tuple, not raise). No way to force 503 in prod without a real outage; reproduce locally by stopping the dependency (e.g. `?check=database` with Postgres down).

### Database (`flirtual-db`)

Fly `postgres-flex` (17.2) HA cluster in `iad`, org `flirtual`: primary + streaming standby, both `performance-4x`, **16 GB RAM** (resized 2026-06-01 from 8 GB). The app connects via `flirtual-db.flycast:5432` → each node's HAProxy → the current primary on `:5433`. The app does **not** use the standby.

**Restarting the primary** (resize, PG upgrade, restart-only GUCs) causes an outage. Never restart the *active* primary; move the primary role to the standby first via a graceful repmgr switchover.

- **Do NOT `fly pg failover`**: broken on this unmanaged cluster; errors `no active leader found` and bounces HAProxy on both nodes, a 1-2 min outage (`... dropped from queue`) without completing.
- **Do NOT `fly machine update --vm-memory` the active primary**: the restart leaves ~25 s with no primary.

Zero-(minimal-)downtime resize:

```bash
# 1. Resize the STANDBY first — zero app impact (app only talks to the primary).
fly machine update <standby-id> --vm-memory <MB> -a flirtual-db -y
#    wait until it rejoins streaming at 0 lag (see "checks" below)

# 2. GRACEFUL switchover: promote the resized standby, cleanly demote the old primary.
#    Run from the STANDBY, as the postgres user. ALWAYS --dry-run first.
fly ssh console -a flirtual-db --machine <standby-id> -qC \
  "su postgres -c 'repmgr -f /data/repmgr.conf standby switchover --dry-run --siblings-follow'"
#    expect: "prerequisites for executing STANDBY SWITCHOVER are met" — then drop --dry-run.

# 3. Resize the OLD primary (now a standby) — zero app impact.
fly machine update <old-primary-id> --vm-memory <MB> -a flirtual-db -y

# 4. (optional) switch back with another `repmgr standby switchover`.
```

A graceful switchover cuts the no-primary window to a few seconds, but still severs pooled connections for ~1-2 s (old primary `pg_ctl -m fast stop`, HAProxy re-routes, Postgrex reconnects). Truly invisible cutover also needs app-side retry on transient DB disconnects, a session-preserving pooler (PgCat/PgBouncer PAUSE/RESUME), or Fly Managed Postgres (`fly mpg`).

**repmgr notes** (run as postgres, `su postgres -c '...'`; it refuses root; config `/data/repmgr.conf`):
- Cluster state: `fly ssh console -a flirtual-db --machine <id> -qC "su postgres -c 'repmgr -f /data/repmgr.conf cluster show'"`
- Remove stale ghost primary rows (they break `fly pg failover`): `repmgr -f /data/repmgr.conf primary unregister --node-id=<id>`.

**Checks:**
- Replication lag (on primary, `:5433`): `select application_name, state, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) from pg_stat_replication;` (require 0 bytes before switchover).
- Role: `psql ... :5433 -tAc 'select pg_is_in_recovery()'` (`f` = primary, `t` = standby).
- App health after: watch `fly.app.name:flirtual` logs for `Sent 200` vs `dropped from queue` / `tcp recv` (see the team's prod-access notes for Fly/VictoriaLogs).
