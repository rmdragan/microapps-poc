# Relay · Next.js Multi-Zone proof of concept

One delivery platform, four independently deployed frontends, one domain.

Relay is a working PoC for the architecture question "can each delivery sub-team own
and ship its own app without losing a coherent product?" It uses Next.js Multi-Zones
behind a real reverse proxy, a shared design system, and edge-injected identity.

```
http://localhost:3000
  /              shell            Next.js     :3001
  /catalog       catalog zone     Next.js     :3002
  /ops           operations zone  Next.js     :3003
  /reports       reports zone     Vite + React :3004
  /api           mock API         Hono        :4000
```

## What it proves

- **Independent deploys.** `pnpm ship zone-catalog` rebuilds and restarts one zone.
  The shell and the other zones keep running the builds they had.
- **Failure isolation.** `pnpm stop zone-ops` takes one upstream down. The edge serves
  a branded 503 for `/ops` only; everything else keeps serving.
- **Shared chrome across frameworks.** The Next shell, the Next zones, and the Vite SPA
  all render the same header, footer, tokens, and user menu from `@micro/ui`.
- **Shared session.** Sign in once, and the user appears in every zone. Zones never see
  the session cookie; the edge strips spoofed identity headers and injects its own.
- **Honest cross-zone navigation.** Moving between zones is a document load. It is
  softened with cross-document view transitions and hover prefetching, not hidden with
  Module Federation.

## Requirements

- Node 22 or newer (developed on Node 26)
- pnpm 12 (`npm i -g pnpm@12`)
- Caddy 2.7 or newer (`brew install caddy`, or see the Caddy install docs)
- Google Chrome for the Playwright suite (or change the project channel)

## Run it

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. `pnpm dev` starts all five apps, writes the edge config
from the route registry, starts Caddy, and waits for every upstream before printing the
URL table.

The mock session lives in memory. Reset settings, the audit trail and any simulated
failures without restarting it:

```bash
curl -X POST http://localhost:3000/api/_admin/reset
```

## Demo script

1. **Overview.** Open `/`. The routing panel is generated from the same registry the
   proxy uses. The footer shows the shell build.
2. **Cross-zone navigation.** Click *Service catalog*. The URL changes to `/catalog` and
   the document reloads. The header stays put thanks to a cross-document view transition.
   In DevTools, run `window.__zoneMarker = "shell"` before clicking; the marker is gone
   after the navigation.
3. **Same-zone navigation.** Open a service. The marker survives: this is a client-side
   navigation. Zone links inside a zone use `next/link`.
4. **Shared chrome.** Open `/reports`. It is a Vite SPA, but the header, tokens, and user
   menu are identical. Client-side navigation inside the zone keeps the marker.
5. **Session.** Visit `/ops` while signed out. The ops zone redirects to the sign-in page.
   Continue, and the session appears in the header on every zone. Sign out from the menu.
6. **Independent deploy.**
   ```bash
   pnpm ship zone-catalog
   ```
   Only the catalog is rebuilt and restarted. Its footer build changes; the shell and
   the other zones keep theirs.
7. **Failure isolation.**
   ```bash
   pnpm stop zone-ops
   ```
   `/ops` now returns a real 503 from the edge, styled like the product. `/`, `/catalog`,
   and `/reports` still work. Restore it with `pnpm start zone-ops`.
8. **Status.**
   ```bash
   pnpm status
   ```
   Shows pids, modes, builds, and a health line per app.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start every app and the edge |
| `pnpm start <app>` | Start one app in dev mode (restores a stopped zone) |
| `pnpm stop [app\|all]` | Stop one app, or everything including the edge |
| `pnpm ship <app>` | Build one app and restart only that app in production mode |
| `pnpm status` | Process, mode, build and health table |
| `pnpm typecheck` | TypeScript across all packages and the tools |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests |
| `pnpm e2e` | Playwright end-to-end suite (starts the stack if needed) |
| `pnpm gen:ingress` | Regenerate `deploy/ingress.yaml` from the registry |
| `pnpm storybook` | Design system stories |

Logs are written to `.run/<app>.log`. Each app also streams prefixed output during
`pnpm dev`.

### Production builds

`pnpm build` runs `next build` and `vite build` for every app. Stop `pnpm dev` first:
Next's dev server and build share `.next`. For a single app, `pnpm ship <app>` stops it,
builds it, and restarts it in production mode while the rest of the stack keeps running.

### Environment

| Variable | Default | Used for |
| --- | --- | --- |
| `PUBLIC_ORIGIN` | `http://localhost:3000` | Absolute redirects, Server Action origins, cross-zone links. Baked into the build. |
| `API_URL` | `http://localhost:4000` | Next server components calling the shared API. |
| `AUTH_MODE` | unset | Set to `mock` to open a zone directly on its port without the edge. |

## Repository map

```
apps/
  shell/            Next.js shell: overview, sign-in, sign-out
  zone-catalog/     Next.js: search, filters, service detail
  zone-ops/         Next.js: Server Action form, audit trail, auth required
  zone-reports/     Vite + React SPA with client-side routing
  mock-api/         Hono + Zod, seeded data, simulated failures
packages/
  routing/          The route registry and URL helpers (single source of truth)
  config/           createNextConfig, shared TS config
  ui/               Tokens, primitives, AppShell, user menu, Next/Vite adapters
  auth/             Session type, header parsing, client provider, server adapter
  api/              Zod schemas and a typed fetch client
tools/
  app.ts            Process manager: dev, start, stop, ship, status
  caddyfile.ts      Generates the local edge config
  edge-page.ts      The 503 page served by the edge
  gen-ingress.ts    Generates the reference Kubernetes Ingress
e2e/                Playwright specs, including failure isolation
deploy/             Generated ingress manifest
docs/               Architecture, decisions, onboarding, demo notes
```

## Read next

- [`docs/architecture.md`](docs/architecture.md): how a request flows, and why.
- [`docs/decisions.md`](docs/decisions.md): the tradeoffs, including the ones we accepted.
- [`docs/onboarding-a-zone.md`](docs/onboarding-a-zone.md): adding the fifth zone.
- [`docs/ci.md`](docs/ci.md): the per-app pipeline shape.
- [`docs/demo.md`](docs/demo.md): the demo with expected output.

## Important caveats

- This is a PoC. Auth is a local stand-in, not an IdP integration.
- `next build` is run per zone by `pnpm ship`. There is no shared build cache in the demo.
- The edge 503 is a static page rendered by Caddy, intentionally independent of the shell.
- A zone's `notFound()` renders the right UI but the streamed response is `200`; the page
  is marked `noindex`. See `docs/decisions.md` for the production options.
