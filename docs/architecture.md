# Architecture

## Goals

- Each delivery domain owns an application with its own code, pipeline, and release
  cadence.
- One product: one origin, one navigation, one design system, one session.
- A broken zone must not take down the platform.
- The routing contract must not drift between local development and production.

Non-goals for the PoC: real IdP integration, i18n, a CDN, observability vendor
integration, and production hardening.

## Request flow

```
browser
   │
   ▼
Caddy :3000  (the edge)
   │  strip inbound X-Auth-Request-* headers
   │  inject identity from the dev-session cookie
   │
   ├── /                 → shell        :3001
   ├── /catalog, /catalog/*  → zone-catalog :3002
   ├── /_assets/catalog/*    → zone-catalog :3002
   ├── /ops, /ops/*        → zone-ops     :3003
   ├── /_assets/ops/*      → zone-ops     :3003
   ├── /reports, /reports/* → zone-reports :3004
   └── /api, /api/*        → mock-api     :4000
```

The shell is not a proxy. Every zone is reached directly by the edge. That is what makes
failure isolation and independent scaling real rather than aspirational.

The edge is also where the 503 page lives. When an upstream is down, Caddy serves a
self-contained HTML page with a real `503` status. The page does not depend on the shell,
so it still works if the shell is the thing that broke.

## The route registry

`packages/routing/src/zones.ts` is the single source of truth:

```ts
{
  id: "catalog",
  label: "Service catalog",
  team: "Catalog",
  path: "/catalog",
  app: "zone-catalog",
  port: 3002,
  assets: "/_assets/catalog",
  framework: "next",
  nav: true,
  auth: "public",
}
```

It drives:

- the local Caddyfile (`tools/caddyfile.ts`)
- the generated Kubernetes Ingress (`pnpm gen:ingress`)
- the global navigation order and labels
- the process manager's ports and commands
- the tests' expectations

CI should treat the registry as a contract. The unit tests in
`packages/routing/src/zones.test.ts` check unique ids, paths, apps, ports, and assets,
plus segment-safe prefix matching (`/ops` must not match `/opsx`).

## The zone contract

A zone is a normal application with four obligations:

1. **Prefix.** Next apps call `createNextConfig("<app>")`, which reads the registry and
   sets `basePath` and `assetPrefix`. The Vite app sets `base` from the registry.
2. **Chrome.** The root layout wraps children in `Providers` (session + zone context) and
   `AppShell`. This is what makes the product feel like one application.
3. **Links.** Cross-zone links must be real anchors. `@micro/ui/next` exports `ZoneLink`,
   which uses `next/link` inside the zone and `<a>` outside it. The Vite app has the same
   adapter for Wouter.
4. **Identity.** Server-side data calls use `createServerApi(headers())`, which forwards
   the edge identity headers downstream.

Everything else is the team's choice. The catalog and the ops zone use different page
shapes, and the reports zone does not use Next at all.

## basePath, assetPrefix, and images

A Next zone is configured twice:

```ts
basePath: "/catalog",
assetPrefix: "/_assets/catalog",
```

- `basePath` makes the app's internal routes live under the public prefix. The team writes
  `/` and `/{id}`; Next produces `/catalog` and `/catalog/{id}`.
- `assetPrefix` moves `/_next/static/*` to `/_assets/catalog/_next/static/*`, otherwise
  every zone would collide on `/_next`.
- The image optimizer is **not** under the asset prefix. Next serves it at
  `/catalog/_next/image`, already basePath-prefixed. No extra config is needed, but
  `next/image` `src` values must include the basePath. `ZoneImage` applies it so nobody
  has to remember.
- HMR works through the proxy because the dev client also lives under the asset prefix
  (`/_assets/catalog/_next/hmr`). This was verified during the spike.

The Vite zone uses `base: "/reports/"`. Vite serves the app under a trailing-slash base,
so the edge rewrites the bare `/reports` path to `/reports/` without changing the URL.

## Navigation and the "seamless" requirement

The requirement was independent deploy, not a persistent React tree. That makes hard
navigation acceptable, but it still has to feel polished:

- `ZoneLink` prefetches a cross-zone document on hover and focus.
- Every zone includes `@view-transition { navigation: auto }` from the shared stylesheet.
- The header and footer have stable `view-transition-name`s, so the chrome morphs instead
  of flashing.
- Same-zone links stay client-side (`next/link`, Wouter).
- UI preferences are CSS/token driven, so they survive the document swap.

What is lost: React state and the shell's in-memory context. Anything that must survive a
cross-zone hop belongs in a cookie, the URL, or server-side state.

## Auth

The PoC models the production shape, not a real IdP:

1. The edge strips any inbound `X-Auth-Request-*` headers.
2. If the `dev-session` cookie is present, the edge injects:
   - `X-Auth-Request-User`
   - `X-Auth-Request-Email`
   - `X-Auth-Request-Groups`
   - `X-Auth-Request-Preferred-Username`
3. Next zones call `getSession()` from `@micro/auth/server`, which parses those headers.
4. Client components read the session from `SessionProvider`.
5. The Vite zone fetches `/api/me`, which the edge also authenticates.

The shell's `/auth/login` page posts to `/auth/login/callback`, a Route Handler that sets
the cookie and returns a **303 HTTP redirect**. This matters: a Server Action redirect
stays inside the current Next app, so a cross-zone redirect would try to render `/ops` in
the shell and 404. Cross-zone redirects must be HTTP redirects.

When the real SSO mechanism is confirmed (forward-auth headers, a JWT, or a shared
cookie), only `packages/auth` changes.

## Data

`apps/mock-api` is a Hono service with Zod schemas shared through `@micro/api`. Every
response is parsed before it leaves the service, and every zone parses it again on the
way in. That catches contract drift early.

The catalog and ops zones call the API server-side and forward the edge identity headers.
The Vite zone calls `/api` through the edge. The API has an in-memory failure switch:

```bash
curl -X POST localhost:3000/api/_admin/fail \
  -H 'content-type: application/json' \
  -d '{"scope":"catalog","on":true}'
```

That is useful for exercising error states without killing a process. Reset the
settings, the audit trail and the failure switches with:

```bash
curl -X POST localhost:3000/api/_admin/reset
```

## Failure isolation

`pnpm stop zone-ops` kills the upstream. The edge sees a connection failure and serves
the 503 page with `Content-Type: text/html`. The tests assert:

- `/ops` returns 503 and shows the edge page
- `/`, `/catalog`, and `/reports` still return 200
- `pnpm start zone-ops` restores the zone

The edge page is static by design: it must not depend on a Next app that might be the one
that is down.

## Deployment shape

`pnpm gen:ingress` writes `deploy/ingress.yaml` from the registry:

- one `Prefix` path per zone and per asset namespace
- `/api` for the shared backend
- `/` for the shell
- annotations for forward-auth (commented, because the platform's mechanism is still an
  open question)

Next steps for a real cluster:

- a Deployment + Service per app (`relay-<zone>`)
- readiness probes on each app's base path (`/catalog`, `/ops`, `/reports/`, `/api/health`)
- resource limits per zone, so one zone's traffic cannot starve another
- a rollback story per zone (the registry makes this possible; the pipeline must use it)

## Version skew and navigation staleness

Every zone mounts the navigation from the shared package at build time. That is a
deliberate tradeoff: no runtime dependency on the shell, but a zone deployed before a nav
change shows the old nav until it is rebuilt.

The footer displays each app's `BUILD_INFO` (`<git sha>+<timestamp>`), so skew is visible
in the demo instead of hidden. Next.js and React versions are pinned in
`pnpm-workspace.yaml`; upgrading them is a coordinated change.

## Testing

- **Vitest**: registry invariants and URL rewriting (segment safety, query preservation).
- **Playwright**: the full stack through the edge, including a cross-zone document-load
  assertion, session sharing, the Server Action, the Vite SPA, and failure isolation.

The "document load" assertion uses a `window` marker: it survives same-zone client
navigation and disappears on a cross-zone navigation. It is a direct test of the
architecture, not a proxy for it.
