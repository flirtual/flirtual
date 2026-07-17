# Flirtual Frontend

Part of the Flirtual monorepo; see the [root CLAUDE.md](../../CLAUDE.md) for the overview, data
flow, environment setup, and image pipeline.

## Stack

- **Framework**: React Router 7 (SSR off, SPA mode)
- **Deployment**: Cloudflare Workers
- **State**: TanStack Query (server state), React hooks (client state)
- **API client**: wretch, auto snake_case (api) ↔ camelCase (frontend)
- **i18n**: i18next (ICU), Weblate
- **Mobile**: Capacitor (iOS/Android); plain webview for visionOS
- **Routes**: file-based under `src/app/[locale]/`: `(public)/` landing; `(app)/(minimal)/` auth/onboarding; `(app)/(public)/` other unauthenticated; `(app)/(authenticated)/` main app; `.../(onboarded)/` profiles/matchmaking/messaging; `.../(moderator)/`, `(admin)/`, `(debugger)/` privileged.

## Commands

```sh
cd apps/frontend

pnpm dev                       # dev server
pnpm typegen                   # generate types
pnpm build                     # production build
pnpm build:preview [branch]    # preview-branch build
pnpm release                   # deploy (auto-detects production / main=canary / preview)
pnpm canary                    # deploy beta staging site
pnpm eslint --fix              # lint

# Mobile (Capacitor): set origin + bundle id, then sync/open/run
export VITE_ORIGIN=https://$(hostname):3000 VITE_APP_BUNDLE_ID=zone.homie.flirtual.beta  # local dev
# beta:  VITE_ORIGIN=https://flirtual.dev VITE_APP_BUNDLE_ID=zone.homie.flirtual.beta
# prod:  VITE_ORIGIN=https://flirtu.al VITE_APP_BUNDLE=zone.homie.flirtual.pwa
pnpm cap sync
pnpm cap open ios | open android | run ios | run android
```

### Adding a `VITE_*` env var

Update **all three** or the value bakes in as `undefined`:

1. `.env.example` (documents it for local dev)
2. `src/const.ts` (read via `import.meta.env.VITE_FOO`, export)
3. `.github/workflows/frontend.yaml` (add to the `release` job's `env:` as `VITE_FOO: ${{ vars.VITE_FOO }}`; the workflow only forwards listed vars)

## Styling

Tailwind with custom classes and variants.

- **Classes**: `bg-brand-gradient`; shadows `shadow-brand-1`/`shadow-brand-inset`/`text-shadow-brand`; fonts `font-montserrat` (headings), `font-nunito` (body); focus `focused`/`focusable`/`focusable-within`; `touch-callout-default`/`-none` (iOS); `select-children` (children selectable, off by default).
- **Variants**: `dark:`, `desktop:`, `wide:`, `tall:`, `native:` (iOS/Android app), `vision:` (visionOS), `android:` (native or web), `apple:` (iOS/visionOS/macOS, native or web), `[locale]:` (e.g. `en:`, `ja:`).
- **Theming**: gradient vars `--theme-1`/`--theme-2`; light/dark pink themes, overridden in Homie Mode (green), by Arc browser theme, or by a Premium user's profile theme (within the profile component).
- **Rich text**: Quill + sanitize-html for the bio editor.
- **twMerge()**: for conditional styling.

## Patterns

- **Utilities**: check `src/urls.ts`, `src/date.ts`, `src/utilities.ts` before adding one; put reusable helpers there.
- **Components/hooks**: prefer ours in `src/components/`, `src/hooks/` (Form, InputText/InputLabel, Button, Link/InlineLink, Image, Dialog/DrawerOrDialog/useDialog, useToasts).
- **Native**: use Capacitor APIs/plugins (preferences, clipboard, capacitor-datetime-picker).
- **API**: clients in `src/api/` (wretch, auto case conversion).
- **Auth**: session via TanStack Query (`useSession`, `useUser`).
- **Routing**: import from `~/i18n`, not `react-router`, for locale-aware `Navigate`/`useNavigate`/`useMatch`/`redirect`.

### Translations (i18next)

All user-facing text goes through i18next; add ICU keys to `messages/en.json` and `messages/ja.json`.

```tsx
const { t } = useTranslation();
t("foo");
t("items_count", { count: 5 });

<Trans i18nKey="bar" components={{ link: <InlineLink href={urls.example} /> }} />;
```
