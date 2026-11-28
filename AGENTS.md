# Flirtual — project instructions

Shared, cross-app context for the monorepo; per-app details live in each app's own AGENTS.md
(linked below). For work spanning both apps (API contract changes, the image pipeline, anything
crossing the frontend/API boundary), load this file plus each relevant app's AGENTS.md first.

## Overview

Flirtual is a dating app for VR users. The monorepo contains:

- **Frontend** (apps/frontend/): TypeScript/React Router SPA on Cloudflare Workers, with Capacitor iOS/Android apps and native watchOS app. See [apps/frontend/AGENTS.md](apps/frontend/AGENTS.md) for stack, commands, styling, patterns, translations.
- **API** (apps/api/): Elixir/Phoenix; data, auth, business logic. See [apps/api/AGENTS.md](apps/api/AGENTS.md) for stack, commands, patterns, matchmaking, moderation, schema, prod/DB ops.

Other services, all under `apps/`:

- **image-classification/**: TensorFlow image moderation (NSFW/inappropriate).
- **session-transfer/**: carries a logged-in session across the flirtu.al → flirtual.com migration via a single-use, API-minted token.
- **app-redirect/**: Worker that sends a link into the native app, or to the right store listing when it isn't installed.
- **maintenance/**: Worker serving a 503 maintenance page; a `flirtual-maintenance` cookie matching `TOKEN` passes through. Also holds the static legal pages and `.well-known/` files.
- **posthog-proxy/**: Worker proxying PostHog ingest and caching its static assets.
- **preview-router/**: Worker routing preview hostnames (PR number or commit SHA) to the matching preview deployment.
- **embed/**: Worker behind chat link embeds (`embed.flirtual.net`, `embed-beta.flirtual.net` for canary); see below.

## Chat link embeds

`apps/embed` unfurls links in chat messages for the TalkJS theme (`conversation-chatbox/link-embed.tsx`):
domain rules adapted from Iframely, then oEmbed, then `twitter:player`/`og:video`, then an OpenGraph card.
X and Bluesky posts skip all of that: `src/posts.ts` reads them from X's syndication endpoint and
Bluesky's public API, and the app draws them itself, without either site's scripts.

- **Allowlist**: `apps/api/priv/chat/allowed-hosts.json` mirrors the TalkJS role's "Allowed hostnames"
  under link suppression, and `allowed-matches.json` beside it its "Suppression exceptions"; keep them
  in step. The embed worker imports both, and the built-in chat masks every other link with them. Hosts
  are checked on the link and again where its redirects end; an exception covers its own redirects.
- **Isolation**: players run in `/frame` on the embed origin, whose own CSP holds `frame-src` and
  `script-src` to the allowlist and `frame-ancestors` to `ALLOWED_ORIGINS`. The app's CSP only ever
  names the embed origin. The app frames it with `allow-scripts allow-same-origin` and no top
  navigation, which is only safe on another registrable domain: never serve it from the app's.
- **Proxying**: preview images and videos go through HMAC-signed `/image` and `/media` URLs
  (`SIGNING_KEY` secret), so a recipient's IP never reaches arbitrary hosts.
- **Klipy** (the GIF picker, `VITE_KLIPY_APP_KEY`): its terms require API calls and media loads
  from the person's own client, unproxied and uncached, with results in the order returned. The
  worker never fetches Klipy URLs; the app renders them itself.

## Chat

With `TALKJS_APP_ID` (API) and `VITE_TALKJS_APP_ID` (frontend) unset, the built-in chat replaces
TalkJS, on our own tables and Phoenix Channels. `Flirtual.Chat.enabled?/0` is the switch on the
API; the frontend picks `components/chat` over `components/conversation-chatbox`, which share their
TalkJS-free helpers.

- **Storage**: `conversations` (id is `Talkjs.new_conversation_id/2`, so links and a later history
  import line up), `conversation_participants` (unread count, read position, `left_at`), `messages`,
  `message_reactions`. A conversation only ever closes for both people (`Chat.disband/1`), so removing one
  (`DELETE /v1/conversations/:id`) unmatches too. A match
  lists once it has a conversation row: new matches and the faker create one, nothing backfills
  older ones.
- **Ordering**: every change takes the next `conversations.seq` under its row lock: a message's `seq`
  orders it, its `version` is the seq of its last change, and a deleted message stays as an empty
  tombstone so clients can catch up by version.
- **Realtime**: socket `/chat` (`FlirtualWeb.ChatSocket`), signed in with a token from
  `GET /v1/conversations/token`, which is bound to the session and refused once that session is gone. `user:<id>` carries unread state; `conversation:<id>` is joined only
  while that chat is on screen. Who is viewing is tracked on a `viewing:<id>` topic no client can
  join, so a push is skipped for someone already reading without their match seeing it.
- **Access**: `Flirtual.Chat` is the only write path and `Chat.authorize/3` the only access rule, for
  channels and REST alike (`Conversation.Policy` delegates to it).
- **Links**: text is stored as sent and masked when rendered (`Flirtual.Chat.Links`); moderators read
  it unmasked. The API alone decides what a link is: each message carries the UTF-16 positions of its
  allowed links in the masked text, and the app links only those. `Flirtual.Chat.Tlds` fetches the
  IANA TLD list at boot and weekly to recognise bare domains; until it loads, any alphabetic ending
  counts, so the API over-masks.
- **Notifications**: `ObanWorkers.ChatPush` and `ChatEmail` are enqueued with the message. APNs
  payloads are mutable and handled by the `Notifications` extension (GIF attachment, sender avatar,
  custom emoji from `static/emoji`); FCM payloads are data-only and drawn by `NotificationService.java`.
  iOS can't attach the animated WebP a GIF message holds, so the client sends Klipy's small GIF
  rendition with the message (`gif.preview`) and it rides in the push job, never stored. A reply from
  an iOS notification is posted natively with the session cookies `WatchSession` caches in the Keychain,
  since the web view's cookie store doesn't answer in the background.

## Data flow

Frontend → `/v1/*` (wretch) → Phoenix router (`lib/flirtual_web/router.ex`, auth pipelines) →
controllers → context modules → Ecto. Oban runs async/scheduled work (email/push, TalkJS/Listmonk
sync, session/account pruning).

## pnpm workspace

One workspace at the repo root: `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `pulumi`) and a
single `pnpm-lock.yaml`. `pnpm install` from anywhere installs every app; `packageManager` lives
only in the root `package.json`.

- `packages/` holds libraries used by other members: `packages/pulumi-fly` and
  `packages/pulumi-listmonk` are the Fly.io and Listmonk dynamic providers behind the `pulumi`
  submodule. CI doesn't check out the submodule, and a frozen install skips it once its empty
  directory is removed; every job that installs the whole workspace runs `rmdir pulumi` first
  until pnpm/pnpm#17712 is fixed.
- `frozenLockfile` is on, so `pnpm install` never rewrites `pnpm-lock.yaml`: a resolving install
  silently drops the `pulumi` importer whenever the submodule isn't checked out, as in a fresh
  worktree. After editing a `package.json` by hand, run `pnpm install --no-frozen-lockfile`.
  `pnpm add` ignores the setting, so run `git submodule update --init pulumi` before adding a
  dependency in a fresh worktree.

- Versions shared by more than one app (`typescript`, `eslint`, `wrangler`, `vitest`, …) live in
  the root `catalog:` and are referenced as `"typescript": "catalog:"`. Bump them there, not in the
  apps.
- `apps/image-classification`'s Fly image builds with the repo root as context so the shared
  lockfile is in scope; its ignore rules live in `Dockerfile.dockerignore`. The API's does too,
  for `packages/data`.

## Data catalog

`packages/data` (`@flirtual/data`) holds Flirtual's reference data as JSON in the repo, not in the
database. The API compiles it in and serves it (`GET /v1/<name>?locale=`, as `/v1/genders`);
the frontend and the watch read it from there rather than bundling it, so a change is live
everywhere once the API deploys. The frontend bundles only `locales.json`, which its routes need
at build time, and takes the others' types from the package without their data. Each file sits
flat under `content/`, named in the plural for what it holds. `meta.json` has a row for every
file: its `type`, the singular for one of its entries (`genders.json` holds genders, each of type
`gender`), the JSON Schema each entry follows, besides its id, and, for a file served at
`GET /v1/<name>`, its `endpoint`: the default `order`, whose keys are the ones it accepts. Text
fields aren't in it; the English overlays define those:

- `genders.json`, `sexualities.json`, `interests.json`, `interest-categories.json`, `games.json`,
  `platforms.json`, `kinks.json`, `prompts.json`, `relationships.json`, `countries.json`,
  `languages.json`, and the reasons (`ban-reasons.json`, `warn-reasons.json`,
  `report-reasons.json`, `delete-reasons.json`): what profiles are tagged with and moderation
  picks from.
- `plans.json`: the plans (`monthly`, `lifetime`, `promotional`, …), with each store's product
  id. `Flirtual.Plans` looks them up by id or store id, entitlements hold the plan's id, and
  `GET /v1/plans?locale=` lists them, named.
- `locales.json`: every locale the app ships, its native name, and whether it is enabled.

Every file is keyed by id. Ids are readable snake_case names (`woman`,
`brat_tamer`, `underage`), as short as stays clear (`intp`, not `intp_logician`; no `_vr` on
games), or codes where a standard gives one (`ca`, `en`); they are unique within their own file
and never change, since stored rows reference them. Never use an integer-like id: JavaScript
would move it to the front. Nothing depends on where an entry sits in its file, and every key
is kept sorted: curated order is each entry's `internal.curated` (1 first), and entries without
one follow, by name. Entries from before readable ids keep their old ShortUUID as `internal.legacy_id`, which the migration away from the `attributes` table maps
from; new entries don't need one. The catch-all entry a picker preselects (`other`) has
`"default": true`.

Text lives beside each file in overlays, `<name>.<locale>.json`: the same ids, holding only what
is shown to people (`name`, `details`, `definition`, …) and never a field of the base entry.
English is an overlay too, and as the default locale (`"default": true` in `locales.json`) it
fills in whatever another locale lacks. In Weblate each file is a component `data/<name>` under
the `data` category, made by component discovery from the English overlays; Weblate owns every
other locale. Text is ICU message format, as everywhere else (`{brand_name}`): the frontend formats
it in `Data.list`, and the API with `Flirtual.ICU.format/3`.

- **Adding**: append an entry under a new id and ship its English text in `<name>.en.json` with
  it; it's live everywhere once the API deploys. A new field goes in the file's schema first.
- **Deleting**: remove the entry. Stored rows that still hold its id drop it when they load.
- **Fields**: everything besides `internal` is sent to clients; `internal` (curated order,
  legacy ids, game release dates, country names) stays on the server.
- **Checks**: `pnpm lint` in `packages/data` checks that every file is formatted, with keys
  sorted and each key or list item on its own line (`pnpm fmt` does both). Every entry is checked
  against its schema (with JSV) when the data compiles, so an entry that doesn't match fails the
  API's build.

### In the API

`packages/data` is also a Mix project, `:flirtual_data`, which the API takes as a path dependency.
`Flirtual.Data` compiles every file into a module named for its type (`ban-reasons.json` is
`Flirtual.Data.BanReason`), and recompiles when one changes or Weblate adds a locale; the API's
`mix format` covers its Elixir. `Data.modules()` lists them, and each one reads its file. Alias
the ones a module uses (`alias Flirtual.Data.{BanReason, Gender}`) and call them by type:

- `Gender.all()`, `Gender.ids()` and `Gender.get(id)` return entries as that module's structs,
  holding `id`, `internal`, every field the file's schema declares, and its text (`name`,
  `details`, …) in the default locale. `Gender.all(locale)` and `Gender.get(id, locale)` give the
  text in a locale, filled in from the default locale's; the overlays themselves stay inside the
  module. Match on the structs (`%BanReason{} = reason`, `gender.conflicts`) rather than on a
  generic map, and reach an entry's file through its struct (`entry.__struct__.get(id)`,
  `.file()` for its name). Text is ICU: format it with `Flirtual.ICU.format/3` before
  sending it anywhere, as a ban email does with `reason.details`.

A new file gets its struct and getters on the next compile.

- **Storage**: every reference is text holding the entry's id. A profile keeps one `text[]` column
  per file it draws from, named for it (`genders`, `sexualities`, `interests`, `games`,
  `platforms`, `kinks`; preferences `genders` and `kinks`), declared as
  `field :genders, Flirtual.Entries, of: Gender`, which loads that file's structs in display
  order and refuses ids it doesn't have. Nothing stores a list that mixes files, and profile JSON
  sends each field as its ids. `GET /v1/<name>` lists a file (`/v1/genders`), with its text
  given `?locale=`, in the order `?order=` asks for (`Flirtual.Order`): a list of keys, each
  breaking ties in the one before, `-` reversing one: `curated`, `name` (collated for the locale,
  with `ex_cldr_collation`) and, for games, `popularity`. It defaults to the file's `endpoint`
  order in `meta.json`.
- **Game order** is the one runtime part: each API node scores games by popularity at boot and
  then daily (`Flirtual.Popularity`, held in ETS, not the database), served as
  `GET /v1/games?order=curated,-popularity`. Timezones are computed by the API, at `GET /v1/timezones`.
- **Search index**: Manticore holds tags as the `tags`/`tags_lf` columns and `tag:`/`lf:` tokens.
  Changing a column means a new table name (`config :flirtual, Flirtual.Search, table:`): each node
  creates the table at boot and reindexes it while it's empty.

## Static assets

`static/` holds the frontend's logos, icons and art, imported as `~/static/...` and bundled at
build time under hashed names. Logos and icons are `logo-*.svg` and `icon-*.svg`, named for their
own colour: `light` is white text (or a white icon) for dark backgrounds, `dark` is black for
light ones, `color` is the full-colour icon, and `background` sits on the brand gradient.

Anything that needs a stable URL gets an alias in `src/app/_redirects.ts` instead: `/favicon.ico`,
`/bimi.svg`, and every logo and icon as a PNG at 128, 256, 512 and 1024 pixels wide, as in
`/logo-dark-512x.png`. The API builds the email header's from `FRONTEND_ORIGIN`. Keep those
redirects temporary, since the target changes with every build. The maintenance worker copies
what it shows from `static/` when it deploys.

Flirtual's static bucket (`static.flirtual.com`, the `global` stack's `staticBucket`) holds public
files that live outside the repo: images the Discord bot and its posts link to, and the Android APK
that `android-apk.yaml` publishes. The frontend's own art comes from `static/`, never the bucket.
Other brands have none, so anything a brand needs from it must be optional.

## Image uploads

Cross-app pipeline (frontend Worker + API + image-classification):

1. **Upload** (`InputFile`/Uppy): direct to R2 (`uploads.flirtual.com`, S3 API); returns object key, which the frontend sends to the API.
2. **API** (`Flirtual.User.Profile.Image`): creates a `profile_images` row (`scanned: false`); an R2 notification queues processing.
3. **Processing** (`apps/frontend/src/worker/queue/user-uploads/`): generates variants (Cloudflare Images/sharp) back into R2, then queues classification.
4. **Classification** (`apps/image-classification/`): returns moderation results; API sets `scanned: true`; flagged images ping moderators via Discord webhook.

R2 layout: originals at `uploads.flirtual.com/[key]`, variants at `[key]/[variant].jpg` (`thumb`, `icon`, `avatar`).

## Branding and feature flags

Flirtual is also the upstream for other apps, so brand values and some features come from env
vars, read separately by each app:

- **Brand**: `VITE_BRAND_*` → `apps/frontend/src/brand.ts` (defaults in `src/brand.defaults.json`,
  also read by tailwind, capacitor, gradle and watchOS); `BRAND_*` → `Flirtual.Brand`
  (defaults in `config/runtime.exs`). Only the name, colours, background and GIF searches have defaults. `VITE_BRAND_ASSET_DOMAIN` and `VITE_BRAND_REPOSITORY_URL` (AGPL) are required; every
  other value is optional, and whatever links to an unset one must disappear, not break.
- **Flags**: `VITE_FEATURE_*` → `src/features.ts`; `FEATURE_*` → `Flirtual.Features`. Homie Mode,
  personality, VR tags (platform + game), VRChat, playlists, timezones, custom interests, advanced filters, the list of connection providers, and (frontend
  only) the events, news and press pages, the APK download link, the landing page, without
  which `/` is a welcome screen with sign-up and login, and the list of fun features
  (`VITE_FEATURE_FUN`: snowfall, assistant, ranked; empty removes the fun settings page). Login methods are API-only
  (`FEATURE_LOGIN`): the frontend renders what `/v1/config`'s `login_providers` lists, minus any
  method not configured.
- **The rule**: a flag gates what the UI offers and what new writes may use. It never shrinks a
  wire type or `Ecto.Enum` (queue kinds, connection types, advanced filter categories), because
  rows written before a flip must still load. Data in a disabled feature is ignored, not rejected
  or deleted, so forms that send it back still save; hence paired accessors like `Queue.kinds/0`
  vs `all_kinds/0`.
- **Where flags are checked**: in API controllers, never around routes in `router.ex` (runtime
  config loads after the router compiles). `src/features.ts` stays import-free because `routes.ts`
  loads it where `~/` doesn't resolve.
- **Native**: xcodebuild doesn't read shell env vars, so `ios.yaml` passes brand and flag values
  as build settings (watchOS and visionOS read them from Info.plist); Android takes the brand
  colour as a gradle `resValue`. Mobile workflows only see repository-level variables; per-channel
  ones (`*_PRODUCTION`/`*_BETA`, e.g. `APP_SCHEME_*`, `APP_LINK_HOSTS_*`, `GOOGLE_SERVICES_JSON_*`)
  override Flirtual's committed values when set.
- **Deploys**: the repository variable `CI_DEPLOY=0` skips the image pushes and Fly and Cloudflare
  deploys in the API, frontend and image classification workflows, for forks that deploy with
  Pulumi; their builds and checks still run.

## Development workflow

- **Backend**: edit Elixir (hot reload) → `mix check` → test with curl.
- **Frontend**: edit TS/React (hot reload) → `pnpm tsc` → test manually.
- **portless**: `pnpm dev:portless` in `apps/frontend` and `./dev.sh --portless` in `apps/api`
  serve both on `.localhost` names from `shims/portless`: one pair per checkout and
  worktree, so forks never collide. See `apps/frontend/README.md`.
- **Database**: `mix ecto.gen.migration` → edit → `mix ecto.migrate` (no rollbacks).
- **API contract**: update the controller and frontend client together, plus `Watch/API.swift` if watchOS uses the endpoint.
