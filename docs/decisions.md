# Decisions

Each entry records the context, the choice, and what it costs. These are the arguments a
future team will need when the PoC becomes a platform.

---

## 1. Multi-Zones, not Module Federation

**Context.** Teams need independent deploys. The first instinct was a persistent shell
with seamless client-side transitions.

**Decision.** Use Next.js Multi-Zones: separate applications, hard navigation across zone
boundaries. Accept the reload. Spend the effort on prefetching and cross-document view
transitions instead.

**Why.** The requirement that survived the grilling was independent deploy. A persistent
React shell would have required Module Federation: no RSC across the boundary, React/Next
version coupling, a runtime contract per remote, and a remote failure that can break the
shell. That is a much larger bet.

**Cost.** No shared in-memory state across zones. Every zone mounts its own providers.
Cross-zone navigation is a document load.

---

## 2. Path-based routing on one domain

**Context.** Zones could live on subdomains or under path prefixes.

**Decision.** One origin, path prefixes (`/catalog`, `/ops`, `/reports`).

**Why.** Cookies are shared for free, there is one TLS certificate, and the routing table
fits in one Ingress. Subdomains would have made cookies, CORS, and asset hosting harder
without solving a problem the PoC has.

**Cost.** Every Next zone needs `basePath` and an `assetPrefix`. Path ownership becomes a
governance concern, handled by the registry and segment-safe matching.

---

## 3. The edge routes; the shell does not proxy

**Context.** Multi-Zones docs suggest a Next.js app with `rewrites` as a router. It is the
simplest way to start.

**Decision.** Caddy in development and a Kubernetes Ingress in production route directly
to each zone. The shell is just another upstream.

**Why.** The shell-as-proxy makes the shell a single point of failure and adds a network
hop to every zone request. It also hides the routing table inside a Next config. The edge
config is generated from the registry, so it cannot drift.

**Cost.** Central middleware is no longer free. Auth has to live at the edge (or in each
zone). That is the production-correct model anyway, but it is more work up front.

---

## 4. Monorepo with independent pipelines

**Context.** Independent deploy does not require independent repositories.

**Decision.** One pnpm workspace, one app per zone, one CI job (and image) per app.

**Why.** The shared design system is a workspace dependency on one version. Version skew
and "which package version is this zone on" disappear. Teams still ship independently.

**Cost.** Repository-level isolation is weaker. CODEOWNERS and path-scoped CI become the
boundary. If a team later needs a separate repo, the registry and the app contract make
the move mechanical.

---

## 5. Shared packages ship TypeScript source

**Decision.** `@micro/ui`, `@micro/auth`, `@micro/api`, `@micro/routing`, and
`@micro/config` export `.ts`/`.tsx` source. Next transpiles them; Vite compiles them.

**Why.** No build step, no stale `dist`, no source maps that point at a rebuilt file. It
also makes the "edit the design system and see it everywhere in dev" loop instant.

**Cost.** Consumers must transpile workspace packages (`transpilePackages` in Next,
`optimizeDeps.exclude` in Vite). Publishing them to a registry would require a real build.

---

## 6. `basePath` plus a per-zone `assetPrefix`

**Decision.** Each Next zone sets `basePath: "/<zone>"` and
`assetPrefix: "/_assets/<zone>"`. The Vite zone uses `base: "/<zone>/"`.

**Why.** Teams write routes as if they own the root. The registry owns the public prefix.
Static assets never collide on `/_next`.

**Cost.** `next/image` needs the basePath in `src` (wrapped by `ZoneImage`). HMR and the
image optimizer needed verification; both work through the proxy in the current stack.

---

## 7. Cross-zone links are anchors, wrapped once

**Decision.** `ZoneLink` renders `next/link` for same-zone destinations and `<a>` for
everything else. The Vite app has the same adapter for Wouter.

**Why.** Next's client router will try to render `/ops` inside the catalog app if you use
`Link`. That produces a 404, not a navigation. The wrapper makes the correct behavior the
easy path.

**Cost.** Every app must pass its adapter into `AppShell`. Raw `next/link` still works for
same-zone links, but it is a footgun for cross-zone paths. The onboarding guide calls this
out.

---

## 8. Navigation is built at build time

**Decision.** Each zone bundles the nav from the registry at build time.

**Why.** No runtime dependency on the shell. Failure isolation stays intact. A nav change
reaches a zone on its next deploy.

**Cost.** A stale zone can show a stale nav. The build badge in the footer makes the skew
visible. A runtime nav endpoint is the alternative if the product cannot tolerate it, at
the price of a new failure mode.

---

## 9. Identity is edge-injected headers

**Decision.** The edge strips inbound `X-Auth-Request-*` headers and injects them from the
session. Zones parse the headers behind an adapter. Cross-zone redirects use HTTP 303s,
not Server Action redirects.

**Why.** This matches the likely production mechanism (oauth2-proxy or forward-auth) and
keeps the SSO cookie out of every zone. The 303 detail is not cosmetic: a Server Action
redirect keeps the navigation inside the current Next app, so `/ops` would 404 in the
shell.

**Cost.** The exact SSO mechanism is still unconfirmed. `packages/auth` is the seam; a JWT
or a shared cookie adapter is one file.

---

## 10. Vite serves under a trailing-slash base; the edge rewrites the bare path

**Decision.** `/reports` is rewritten to `/reports/` before proxying, without changing the
browser URL.

**Why.** Vite's base is trailing-slash oriented. Redirecting would make every nav click a
308; a rewrite keeps the canonical URL and serves a 200.

**Cost.** One extra matcher in the generated edge config. It is derived from
`framework === "vite"`, not hand-written.

---

## 11. Not-found pages stream with a 200 status

**Context.** `notFound()` in a streamed App Router response cannot change the status after
the shell has flushed. Even a synchronous `notFound()` returns 200 in this setup, because
the root layout awaits the session.

**Decision.** Keep the zone-owned, shared-chrome not-found UI and mark it `noindex`.
Document the caveat instead of adding a middleware data check.

**Why.** A correct 404 status would require an edge/middleware lookup or a synchronous
layout, both of which add complexity disproportionate to a PoC.

**Production options.** Validate the id in middleware and return a real 404 with a
static page, or handle unknown ids at the edge. Both are straightforward once the
constraint is known.

---

## 12. Local development uses a real proxy

**Decision.** `pnpm dev` starts `next dev` / `vite` per app and a Caddy instance generated
from the registry. No docker-compose, no local cluster.

**Why.** Real path routing and real websockets without the cluster tax. HMR works through
the proxy because the dev client respects the asset prefix.

**Cost.** Caddy must be installed. The production Ingress is only exercised as a generated
manifest, not in the demo. `docs/onboarding-a-zone.md` includes the cluster checklist.

---

## 13. Design system is Tailwind 4 plus Radix primitives

**Decision.** Tokens live in `@theme`; components are owned in the monorepo; Radix supplies
the accessible interaction primitives (dropdown, slot, avatar).

**Why.** Each zone compiles its own CSS from shared source, so there is no global CSS
collision across zones. No runtime styling library, no version lock to a vendor.

**Cost.** Teams must not override tokens ad hoc. A visual regression suite would be the
next investment.

---

## Open questions

1. The real SSO mechanism: forward-auth headers, a signed JWT, or a shared cookie?
2. Which ingress controller the platform standardizes on (`nginx` is assumed in the
   generated manifest).
3. The production origin and asset hostnames, if a CDN enters the picture.
4. Whether the nav may ever go stale, or needs a runtime source.
