# Demo script

A ten-minute walkthrough for stakeholders. Commands are run from the repository root.

## Before the room

```bash
pnpm install
pnpm dev
pnpm status
```

Open <http://localhost:3000> and keep a terminal visible. If you want a clean state,
restart `mock-api` (it resets the in-memory settings) by stopping and starting it:

```bash
pnpm stop mock-api && pnpm start mock-api
```

## 1. The platform at a glance (1 min)

- The routing panel on the home page is generated from `packages/routing/src/zones.ts`.
  It is the same data the edge and the tests use.
- Point at the footer: `shell @ <sha>+dev`. Every app prints its own build.
- Say the constraint out loud: one origin, independent deploys, a document load when you
  cross a zone boundary.

## 2. The two kinds of navigation (2 min)

1. In DevTools, run:
   ```js
   window.__zoneMarker = "shell";
   ```
2. Click **Service catalog**.
3. The URL is `/catalog`. The header stays put. The marker is gone:
   ```js
   window.__zoneMarker; // undefined
   ```
   That is the price of independent deploy. The view transition hides the swap; the
   document still reloads.
4. Open a service. The marker survives this time: inside the zone, `next/link` does a
   client-side navigation.

## 3. Shared chrome across frameworks (1 min)

Open `/reports`. The reports zone is Vite + React, not Next. The header, footer, tokens,
and user menu are identical because they come from `@micro/ui`.

Click **Courier load**. It is a Wouter client route, not a document load. Type
`Amsterdam` in the filter; the table filters client-side.

## 4. One session (1 min)

Open `/ops` while signed out. The ops zone redirects to the sign-in page. Continue, and:

- `/ops` renders.
- The header shows Robin Vale.
- `/catalog` and `/reports` show the same user.
- Sign out from the menu; the header returns to "Sign in".

Explain the mechanism: the edge owns the cookie, strips spoofed identity headers, and
injects the identity headers. Zones never see the session cookie.

## 5. Independent deploy (2 min)

```bash
pnpm ship zone-catalog
```

Expected output:

```
Building zone-catalog (abc1234+202611061600)...
Shipped zone-catalog at abc1234+202611061600. Only this app was rebuilt.
```

Reload `/catalog`. The footer build changed. Reload `/` and `/reports`: their builds did
not. `pnpm status` shows the modes and builds side by side.

## 6. Failure isolation (2 min)

```bash
pnpm stop zone-ops
```

Open `/ops`. The edge serves a real `503` with the product's styling. It does not depend
on the shell. `/`, `/catalog`, and `/reports` still work. Click **Back to overview**.

Restore:

```bash
pnpm start zone-ops
```

Reload `/ops`; it redirects to sign-in, which means the zone is back.

## 7. What we deliberately did not do (1 min)

- No Module Federation. A persistent shell would have required it, and it would have made
  the shell a runtime dependency for every zone.
- No shell proxy. The edge routes directly; the shell cannot take the platform down.
- No per-zone repos. Independent pipelines in one monorepo; the shared package stays on
  one version.
- No real IdP yet. `packages/auth` is the seam for whichever mechanism the platform team
  confirms.

## Reset

```bash
curl -X POST http://localhost:3000/api/_admin/reset
```

That clears the settings changes, the audit entries added during the demo, and any
simulated failures. Logs live in `.run/`.
