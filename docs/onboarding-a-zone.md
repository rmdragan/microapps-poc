# Adding a zone

This is the path a team takes to add the fifth zone. The PoC targets hours, not days.

## 1. Agree the contract

Fill this in before writing code:

- `id`: stable, lowercase, used in the registry and build info (`billing`)
- `path`: the public prefix (`/billing`)
- `assets`: `/_assets/billing` for a Next zone; omitted for Vite
- `app`: the workspace package name (`zone-billing`)
- `port`: the next free port (3005)
- `framework`: `next` or `vite`
- `team`: the owning team
- `auth`: `public` or `required`

Paths are segment-matched. `/billing` will not capture `/billing-history`.

## 2. Scaffold the app

Copy the closest sibling:

```bash
cp -R apps/zone-catalog apps/zone-billing
```

Then, in `apps/zone-billing/package.json`, change `name` to `zone-billing`. Delete the
copied `node_modules` and `.next` if the copy created them (the repo ignores these, but a
copy can bring them along).

For a Vite zone, copy `apps/zone-reports` instead.

## 3. Register the zone

Add one entry to `packages/routing/src/zones.ts`:

```ts
{
  id: "billing",
  label: "Billing",
  shortLabel: "Billing",
  description: "Invoices, tariffs and settlement.",
  path: "/billing",
  team: "Billing",
  app: "zone-billing",
  port: 3005,
  assets: "/_assets/billing",
  framework: "next",
  nav: true,
  auth: "required",
},
```

Run the unit tests. They catch duplicate ids, paths, apps, ports, and asset prefixes:

```bash
pnpm test
```

## 4. Configure the app

Next zones need one line:

```ts
// apps/zone-billing/next.config.ts
import { createNextConfig } from "@micro/config/next";
export default createNextConfig("zone-billing");
```

That is where `basePath`, `assetPrefix`, the image settings, Server Action origins, and
`transpilePackages` come from. Do not hand-write them.

Vite zones set `base` from the registry in `vite.config.ts` (see `zone-reports`).

## 5. Mount the shared chrome

The root layout is the only required piece of the zone contract:

```tsx
const zone = zoneById("billing");

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers user={user} zone={{ id: zone.id, basePath: zoneBasePath(zone) }}>
          <AppShell
            zone={{ id: zone.id }}
            build={{ app: zone.app, version: process.env.BUILD_INFO ?? "dev", mode: process.env.NODE_ENV ?? "development" }}
            linkComponent={ZoneLink}
          >
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
```

If the zone requires auth, call `getSession()` and redirect, or copy
`apps/zone-ops/lib/require-session.ts`.

## 6. Use the right links

Inside the zone, use `ZoneLink` with **public** paths:

```tsx
<ZoneLink href="/billing/invoices">Invoices</ZoneLink>
<ZoneLink href="/">Back to overview</ZoneLink>
```

`ZoneLink` strips the zone prefix for `next/link` and turns other zones into real anchors.
Raw `next/link` with a cross-zone path will try to render the other zone inside this app
and 404.

## 7. Call data through the shared client

Server components:

```ts
const api = createServerApi(await headers());
const invoices = await api.invoices.list();
```

Add the endpoint and its Zod schema to `packages/api` so every consumer sees the contract.
Browser code (the Vite zone) uses `createApiClient({ baseUrl: window.location.origin })`
and calls `/api`.

## 8. Run it

```bash
pnpm install
pnpm dev
```

The new zone appears in the navigation automatically, gets a route in the edge config, and
is started by the process manager. No Caddyfile edits, no port changes anywhere else.

## 9. Build and ship

Add a pipeline job for `zone-billing` that runs:

```bash
pnpm --filter zone-billing build
```

and publishes an image tagged with the commit. The deployment restarts only that image.
Locally, `pnpm ship zone-billing` is the same idea.

The footer badge (`billing @ <sha>+<timestamp>`) proves the build is independent.

## 10. Deploy the route

```bash
pnpm gen:ingress
```

Commit the regenerated `deploy/ingress.yaml`. In production, the platform's GitOps flow
applies it. The zone's Service should be named `relay-billing` and listen on port 80.

Cluster checklist:

- [ ] Deployment with the zone image
- [ ] Service `relay-billing:80`
- [ ] Readiness probe on `/billing` (or `/billing/` for Vite)
- [ ] Resource requests and limits
- [ ] Ingress regenerated and applied
- [ ] Edge forward-auth covers the new path if `auth: "required"`
- [ ] Dashboards and alerts labelled with the zone id

## Footguns

- Do not import `next/link` for cross-zone destinations.
- Do not add a root-level `public/` asset that another zone also references by the same
  path. Use the zone's basePath or the asset prefix.
- Do not hand-edit `deploy/ingress.yaml` or the generated Caddyfile.
- Do not add a new dependency on a different Next major version. Versions are pinned in
  `pnpm-workspace.yaml`; upgrades are coordinated.
- Do not assume the shell is mounted. On a cross-zone navigation, your zone mounts its own
  providers.
