# Reference pipeline

Independent deploy only works if each app can be built, tested, and shipped on its own.
This is the shape to wire into whichever CI the platform uses (GitHub Actions, GitLab,
Argo, or an internal system). It is a reference, not an executed workflow.

## What triggers what

| Change | Rebuild |
| --- | --- |
| `apps/zone-catalog/**` | `zone-catalog` |
| `apps/zone-ops/**` | `zone-ops` |
| `apps/zone-reports/**` | `zone-reports` |
| `apps/shell/**` | `shell` |
| `apps/mock-api/**` | `mock-api` |
| `packages/routing/**` | every app (the contract changed) |
| `packages/ui/**` | every app that renders chrome (all of them) |
| `packages/api/**` | every app that consumes the API |
| `packages/auth/**` | every Next app and the Vite app |
| `packages/config/**` | every Next app |

The registry is intentionally a fan-out input: a route change must reach the edge and
every app that renders navigation.

## Per-app job

```text
pnpm install --frozen-lockfile
pnpm --filter <app> typecheck
pnpm --filter <app> build
docker build -t registry/relay-<app>:<sha> apps/<app>   # or the platform's buildpack
docker push registry/relay-<app>:<sha>
deploy only relay-<app>:<sha>                            # Argo/Flux/Helm/…
```

`BUILD_INFO=<sha>` should be passed to the build or the runtime. The footer displays it,
so skew between zones is visible in production.

The local equivalent is:

```bash
pnpm ship <app>
```

It stops the app, builds it, restarts it in production mode, and leaves every other app
untouched.

## Suite-level job

Run the contract tests and E2E on every PR, independent of the per-app fan-out:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
pnpm gen:ingress && git diff --exit-code deploy/ingress.yaml
```

That last line is important: the Ingress must be generated from the registry, not edited
by hand. A registry change that is not reflected in `deploy/ingress.yaml` fails the PR.

## Example GitHub Actions sketch

```yaml
name: relay
on:
  pull_request:
  push:
    branches: [main]

jobs:
  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 12 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm gen:ingress && git diff --exit-code deploy/ingress.yaml

  apps:
    needs: contracts
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [shell, zone-catalog, zone-ops, zone-reports, mock-api]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 12 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter ${{ matrix.app }} build
        env:
          BUILD_INFO: ${{ github.sha }}
      # build/push/deploy only ${{ matrix.app }}
```

For a large fleet, replace the unconditional matrix with a changed-files filter and keep
`packages/*` as an explicit fan-out. Do not skip the suite job: it is what catches route
collisions, contract drift, and the generated Ingress going stale.

## Deploying the edge

The edge is the platform team's responsibility. The route table should be applied from
`deploy/ingress.yaml`; the apps never edit it. When a zone adds a path, the same PR updates
the registry, the app, and the generated Ingress. The edge then routes the new path as
soon as the zone's Service is ready.

Rollback is per app: redeploy the previous `<sha>` image. The shell and the other zones
are not part of that operation.
