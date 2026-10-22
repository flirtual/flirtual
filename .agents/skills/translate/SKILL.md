---
name: translate
description: Localize Flirtual's user-facing strings (frontend messages, attributes, API notifications) with per-key code context, a shared style guide and glossary, Fable translator and reviewer agents, and Weblate sync (context, glossary, screenshots, draft translations). Modes - context, full, incremental (default). Use after adding or changing keys in messages/en.json, or to refresh translation context.
argument-hint: "[context|full|incremental] [locales, e.g. ja,ko]"
---

# /translate

Localizes `apps/frontend/messages/en.json`, `apps/frontend/messages/attributes.en.json` and
`apps/api/priv/gettext/en/LC_MESSAGES/notifications.po` into the target locales, and syncs
everything through Weblate. Arguments: a mode (default `incremental`) and optional locales
(default all ten: de, es, fr, ja, ko, nl, pt, pt-BR, ru, sv; never any other).

Run every command from `apps/frontend`. Commands that talk to Weblate need `WEBLATE_TOKEN` in the
environment, e.g. from a git-ignored `apps/frontend/.env.weblate`:
`node --env-file=.env.weblate i18n/scripts/<script>.ts …`. Never print the token. Scripts that
write to Weblate are dry runs unless given `--apply`.

## Ground rules

- **Weblate owns translations.** Never edit `messages/<non-en>.json`, `attributes.<non-en>.json`
  or non-English `.po` files. All translation changes go through Weblate.
- **Never overwrite people's work.** `weblate.ts drafts` writes "needs editing" only where the
  text is empty or wasn't written by a person (MT, add-ons, git imports); where a person wrote
  it, a draft becomes a suggestion. People's translations are never redrafted; they only get
  an objective-errors review (grammar, typos, broken placeholders, meaning changes), uploaded
  as a suggestion plus comment.
- **Ask before every Weblate write**, in this session: show the dry-run summary and wait for
  approval. That includes context, glossary, locales, drafts and screenshots, in every mode.
- **Contributor agreement:** if a write stops with the agreement error, stop and tell the
  maintainer; don't retry.
- **Locales:** only the ten above. `weblate.ts locales` may add a missing one of them to a
  component, after approval. Never enable locales in `src/i18n/languages.ts`.
- **Agents, not inline translation:** drafting, review and the context pass each run in a
  subagent whose instructions are a file in this skill's `agents/` directory: `translator.md`,
  `translation-reviewer.md` and `translation-context.md`. Give the subagent that file to follow
  plus the task message below. Don't translate in the main session. No paid APIs.
- **Models:** the `translator` drafts ja and ko on Fable and the eight European locales (de, es,
  fr, nl, pt, pt-BR, ru, sv) on Opus. The `translation-reviewer` (Fable) reviews ja and ko;
  `translation-context` runs on Opus.
- **Unreviewed translations are never style references.** Bundles include only people's
  translations.
- **Watch strings** (`watch: true` in context) only support `{name}` and empty `<name/>`.
- Nothing new goes in `messages/` (the watch app bundles that directory).

## Files

- `i18n/context.json`: per-key context (screens, element, description, placeholders, tags,
  tone, length, `watch`, `needsScreenshot`, `readOnly`, `resolved` answers). Version-controlled.
- `i18n/style/shared.md`, `i18n/style/<locale>.md`, `i18n/style/glossary.json`: the style guide
  and glossary. Decisions from the maintainer go here so they're never asked twice.
- `i18n/translate.lock.json`: English hash per key and locale at translation time.
- `i18n/.staging/` (git-ignored): Weblate pulls, usage index, batches, drafts, reviews.
- Screenshots: outside the repository, in `${XDG_CACHE_HOME:-~/.cache}/flirtual-translate/screenshots/`.

## Mode: context

1. `weblate.ts pull` (existing explanations and human authorship).
2. `context.ts usage`, then `context.ts batches` (only keys with missing or stale context;
   `--all` redoes everything). Clear `.staging/context/out/` first.
3. For each batch, run a `translation-context` agent (several in parallel):
   "Batch file: <abs path to batches/NN.json>. Output path: <abs path to out/NN.json>.
   Repository root: <repo>." Then `context.ts merge` and fix any reported problems.
4. `context.ts questions`. Ask the maintainer with AskUserQuestion, at most four questions per
   call, each with concrete options. Record each answer with `context.ts resolve <id> "<answer>"`,
   and put anything general into the style guide or glossary.
5. `screenshots.ts plan`; review the manual list with the maintainer if it changed.
6. Dry-run `weblate.ts context` and `weblate.ts glossary`; after approval, rerun with `--apply`.

## Modes: incremental (default) and full

1. `weblate.ts pull --locales <locales>`.
2. `context.ts status`. If any key is missing or stale, run the context mode for them first
   (steps 2–4); a string never gets translated without context.
3. `translate.ts plan --mode <mode> --locales <locales> --name <run>` (run: today's date).
   `incremental` takes keys that are new or whose English changed since the lock file;
   `full` takes every key. Keys people translated go to `human-review.json` instead.
4. Translate, per locale and batch, with the `translator` agent (Opus for European locales):
   "Locale: <locale>. Run directory: <dir>. Bundle: <dir>/bundle.md. Batch: <dir>/batches/NN.json.
   Output path: <dir>/out/NN.json. Run commands from <repo>/apps/frontend."
   - Run UI batches first and long-form batches (`legal/*`, `news/*`) last; for those, add
     "UI labels you quote must match the staged drafts in <dir>/drafts.json."
   - Several agents may run in parallel (about 8 at a time).
5. `translate.ts accept --locale <l> --batch NN --file <dir>/out/NN.json --name <run>` for each.
   Failures land in `retry/NN.json`; send them back to a `translator` agent with the errors (up
   to two retries), then `translate.ts queue --locale <l>` and show the queue to the maintainer.
6. **ja and ko:** for each batch, write a copy of the output containing only `translations`,
   and run the `translation-reviewer` agent on it (never the rationale):
   "Locale. Bundle. Batch. Drafts to review (machine drafts): <copy>. Output path: <dir>/review/NN.json."
   Then `translate.ts review --locale <l> --file <dir>/review/NN.json --name <run>`: validated
   fixes replace the drafts, and disagreements (meaning or tone) collect in
   `disagreements.json`. Present those to the maintainer and apply their decisions.
7. **People's translations:** if `human-review.json` isn't empty, run `translation-reviewer`
   in objective-errors mode ("Drafts to review are human translations") on it, then
   `translate.ts review --human …`.
8. **Upload:** `weblate.ts drafts --name <run> --locales <locales>`. Show the per-locale summary,
   wait for approval, then rerun with `--apply`. Commit `i18n/translate.lock.json` (and any
   context or style changes) afterwards; nothing under `messages/`.

## Screenshots (only on request, or when `screenshots.ts plan` changed)

1. `screenshots.ts capture --base <local frontend URL>` with `TRANSLATE_LOGIN`/`TRANSLATE_PASSWORD`
   for a seeded account with obviously fake data; light mode, fixed viewport. Screens without
   a route go to the maintainer to capture by hand (`manual/<slug>.png`, names from `plan`).
2. `screenshots.ts review`. Show the maintainer every image (Read it) with its screen and the
   strings it'll be linked to, one at a time. Generate one session token for this approval
   round, then `screenshots.ts approve <file> --session <token>` or `reject <file>`, or
   recapture on request.
3. `screenshots.ts upload --session <token>` (dry run), then `--apply`. Only files approved in
   this session with an unchanged hash upload.

## Validator

`node i18n/scripts/validate.ts <file> --locale <l>` checks ICU syntax, placeholders and tags
against the English, plural categories per locale, select keys, watch restrictions, glossary
(required and forbidden terms), length for compact UI elements, and locale typography.
Translator agents run it themselves; `translate.ts accept` runs it again.
