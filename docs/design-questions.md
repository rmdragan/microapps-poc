# Discovery questions

This is the record of the questions that shaped the Relay PoC, the options offered, and
the answers that drove the design. It is a decision record, not a specification. The
current architecture lives in [`architecture.md`](architecture.md).

- **Session:** 6 November 2026
- **Format:** one question at a time, structured options plus free-form
- **Scope:** a Next.js Multi-Zones proof of concept for independently deployed delivery
  domains, with a shared shell and shared components

Two answers changed the shape of the project:

1. "No, must be seamless" (Question 7) looked like it ruled out Multi-Zones.
2. "Independent deploy is the requirement" (Question 8) clarified that "seamless" meant a
   polished transition, not a persistent React tree. Multi-Zones stayed, and the effort
   moved to prefetching and cross-document view transitions.

Question 4 was answered "Undecided". It was resolved later by Questions 5, 6, and 16:
direct ingress routing wins once auth lives at the edge and failure isolation is a success
criterion.

## Decision map

| # | Question | Answer | Where it landed |
| --- | --- | --- | --- |
| 1 | What actually hurts today? | Deploy coupling, scaling and infra, multiple business domains | Multi-Zones, one app per domain, per-app deploy |
| 2 | Production hosting | Kubernetes | Generated Ingress, edge-owned routing |
| 3 | URL shape | Path-based, one domain | `basePath`, shared cookies, one TLS cert |
| 4 | Who routes traffic | Undecided, later resolved | Ingress routes directly; the shell is just another upstream |
| 5 | Auth today | Central SSO already exists | Edge-injected identity, zones parse headers |
| 6 | Session transport | Not sure yet | `packages/auth` adapter, header implementation in the PoC |
| 7 | Cross-zone full reload? | No, must be seamless | Triggered the Multi-Zone vs Module Federation conversation |
| 8 | What "seamless" means | Independent deploy is the requirement | Multi-Zones retained; prefetch plus view transitions |
| 9 | Repo topology | Monorepo, independent pipelines | pnpm workspace, per-app build and ship |
| 10 | Current state | Greenfield | Stack and conventions chosen from scratch |
| 11 | Shell scope | All of it | `@micro/ui`, `AppShell`, auth UI, providers, error states |
| 12 | Local dev | Local proxy plus `next dev` | `tools/app.ts` plus generated Caddyfile |
| 13 | Route registry | Single registry file | `packages/routing/src/zones.ts` generates edge and Ingress |
| 14 | PoC zones | Shell plus 2 Next zones plus 1 non-Next zone | Shell, catalog, ops, reports |
| 15 | Data layer | Shared mock API | `apps/mock-api` with shared Zod schemas |
| 16 | Success criteria | Independent deploy, failure isolation, consistent UX, shared session | `pnpm ship`, `pnpm stop`, shared chrome, E2E auth |
| 17 | Assets | Path-prefixed on the same domain | `assetPrefix: /_assets/<zone>` |
| 18 | Nav sync | Build-time registry | `navZones()` bundled per zone; build badge exposes skew |
| 19 | Demo environment | Local proxy is enough | Caddy edge, edge-served 503 |
| 20 | Timebox | No fixed deadline | Storybook, docs, tests, and polish included |
| 21 | Non-Next zone | Vite React SPA | `apps/zone-reports` |
| 22 | Design system | Tailwind plus Radix primitives | `packages/ui` with tokens and owned components |

---

## 1. What actually hurts today?

*Select all that apply.*

| Option | Description |
| --- | --- |
| Deploy coupling | One team's release blocks another. Everyone ships on one cadence. |
| Repo and ownership conflicts | Teams step on each other in the same codebase. |
| Blast radius | A bad change in one area degrades the whole application. |
| Team autonomy | Teams want their own stack, dependencies, cadence, or tooling. |
| Scaling and infra | Different areas have very different traffic or resource needs. |
| Mostly code organization | No hard operational pain yet, just a growing codebase. |

**Answer:** Deploy coupling, scaling and infra, plus a free-form requirement:

> Our business has multiple domains. Each domain has its own app or set of functionalities,
> and we want to be able to dedicate a development team per domain where they can have
> independence on their development and deployment schedule. We want the shell app itself to
> create a standard set of components. Each team would have to use the same Next.js
> framework; we would update them at the same time, roughly. But it's important that each
> team has some autonomy in terms of the functionality, deployment, etc.

**What it drove:** independent deploy and independent scaling became the reason for
Multi-Zones. The same-Next-version constraint ruled out per-zone framework drift. The
"standard set of components" requirement became `@micro/ui`.

## 2. Where will this actually run in production?

| Option | Description |
| --- | --- |
| Vercel | First-party Microfrontends support, routing and assets included. |
| AWS | ALB or CloudFront in front of ECS/Lambda/Amplify. We own routing. |
| Kubernetes | Ingress controller such as nginx, Traefik, or Istio. We own routing. |
| On-prem or other | Self-hosted, another cloud, or a platform-provided ingress. |
| Undecided | The PoC should inform the choice. |

**Answer:** Kubernetes.

**What it drove:** a generated Kubernetes Ingress, an edge that owns identity and routing,
and a local Caddy configuration that mirrors that boundary. The PoC did not use Vercel
Microfrontends.

## 3. How should a zone appear in the URL?

| Option | Description |
| --- | --- |
| Path-based, one domain | `app.example.com/sales`, `/billing`. One cookie domain, one TLS cert. |
| Subdomains per zone | `sales.example.com`, `billing.example.com`. Cleaner isolation, more DNS and cookie work. |
| Mixed | Paths for tightly coupled flows, subdomains for autonomy or legacy. |
| Undecided | Let the PoC compare, or decide later. |

**Answer:** Path-based, one domain.

**What it drove:** shared session cookies for free, one Ingress, `basePath` on Next zones,
and `assetPrefix` to keep `/_next` from colliding.

## 4. Who routes traffic to the zones?

| Option | Description |
| --- | --- |
| Ingress routes directly (recommended) | Ingress sends each prefix to its service. Best isolation and scaling. Auth at the edge. |
| Shell proxies via rewrites | All traffic goes to the shell, which proxies. Central middleware, but the shell is a single point of failure. |
| Hybrid | Ingress routes directly, with a shared auth service or middleware. |
| Undecided | Show the difference in the PoC first. |

**Answer:** Undecided.

**How it was resolved:** Question 5 established that central SSO already exists, and
Question 16 made failure isolation a success criterion. A shell proxy would undermine both.
The design uses direct ingress routing with the edge injecting identity headers. The
tradeoff is recorded in `docs/decisions.md` (#3).

## 5. How is authentication and session management handled today?

| Option | Description |
| --- | --- |
| Central SSO already exists | An IdP plus oauth2-proxy, an API gateway, or forward-auth at the ingress. |
| Each app does its own auth | No shared layer; every app integrates with the IdP separately. |
| Nothing built yet | Auth is a future concern; the PoC can stub it. |
| Out of scope for the PoC | Ignore auth and design without it. |

**Answer:** Central SSO already exists.

**What it drove:** zones never own login. The edge validates the session and injects
identity headers. The shell only renders the sign-in and sign-out affordances.

## 6. What exactly do downstream apps receive after the cluster authenticates a request?

| Option | Description |
| --- | --- |
| Headers from forward-auth | The edge injects `X-Auth-Request-User/Email/Groups`; zones trust them. |
| A JWT the zone validates | The edge forwards a signed JWT; each zone verifies it. |
| A shared session cookie | All apps share an encrypted cookie and a decryption key. |
| Not sure yet | Confirm with the platform team. |

**Answer:** Not sure yet.

**What it drove:** `packages/auth` became the seam. The PoC implements the forward-auth
header adapter and keeps the parsing isolated, so switching to a JWT or a shared cookie is
a one-file change. `docs/decisions.md` (#9) records this.

## 7. Is a full page load when crossing from one zone to another acceptable?

| Option | Description |
| --- | --- |
| Yes, acceptable | Like navigating between sites. No flow needs in-memory state across zones. |
| Yes, if state is persisted | Reload is fine, but cross-zone flows must keep state server-side or in cookies. |
| No, must be seamless | Need client-side transitions and a persistent shell. Multi-Zone cannot do that. |
| Not sure, measure it | Include a realistic cross-zone flow and judge the experience. |

**Answer:** No, must be seamless.

**What it drove:** the critical reframing. Plain Multi-Zones cannot keep a shell mounted
across a document navigation. The next question established whether this ruled out
Multi-Zones entirely.

## 8. When you say seamless, which of these is the real requirement?

| Option | Description |
| --- | --- |
| Persistent shell is the requirement | The shell must never remount. Independent deploy is negotiable. |
| Independent deploy is the requirement | Teams ship on their own schedule. A fast, smooth transition is enough. |
| Both are hard requirements | Persistent shell plus independent deploy. Evaluate Module Federation or iframes. |
| No white flash, no jank | Not literally no reload. Make a document navigation feel instant. |

**Answer:** Independent deploy is the requirement.

**What it drove:** Multi-Zones stayed. "Seamless" became a craft problem: hover prefetch,
cross-document view transitions, stable header markup, consistent skeletons, and persisted
UI preferences. React state still resets across zones, which is accepted.

## 9. Do teams need separate Git repositories, or can they live in one monorepo with independent pipelines?

| Option | Description |
| --- | --- |
| Monorepo, independent pipelines (recommended) | One repo, one app per zone, shared workspace package, per-app pipeline. |
| Polyrepo | One repo per zone plus a published shared library. More autonomy, more version skew. |
| Hybrid | Shell and shared packages in one repo, zones elsewhere consuming published versions. |
| Undecided | Let the PoC show the DX difference. |

**Answer:** Monorepo, independent pipelines.

**What it drove:** pnpm workspaces with a single version of `@micro/ui`, `@micro/auth`, and
`@micro/routing`. Independent deploy is per app, not per repo. The CI shape is in
`docs/ci.md`.

## 10. What already exists that the PoC must account for?

*Select all that apply.*

| Option | Description |
| --- | --- |
| Greenfield | Nothing meaningful exists. We choose the stack now. |
| An existing Next.js app | A current app to split, or conventions to follow. |
| A shared design system | Components, tokens, or Storybook to reuse. |
| Other frameworks | React SPAs, Vue, Angular, or server-rendered apps that may join later. |

**Answer:** Greenfield.

**What it drove:** freedom to set conventions: Next 16, React 19, TypeScript, Tailwind 4,
Radix, pnpm, the registry, and the app contract. It also justified building the design
system from scratch rather than adapting an existing one.

## 11. What does the shell own in the PoC?

*Select all that apply.*

| Option | Description |
| --- | --- |
| Global chrome | Header, primary nav, footer, breadcrumbs, user menu. |
| Design system package | Tokens, primitives, form controls, layout, Storybook. |
| Auth UI and session | Login/logout, user menu, session helpers, typed user. |
| Home page and global features | Landing page, global search, notifications, shared modals. |
| Cross-cutting providers | Theme, i18n, analytics, feature flags, error reporting, query client. |
| Error and edge cases | Global 404, 500, maintenance page, redirect map. |

**Answer:** All of them.

**What it drove:** `@micro/ui` exports `AppShell`, tokens, primitives, states, and a user
menu. Each zone mounts the providers itself. The edge owns the outage page, not the shell.
Theme is CSS-driven; analytics and a shared query client are deferred (see "Not asked"
below).

## 12. How should the whole thing run locally for developers?

| Option | Description |
| --- | --- |
| Local proxy plus `next dev` (recommended) | One command starts each app plus Caddy routing by path. Fast HMR. |
| docker-compose | Everything in containers. Prod-like but slow. |
| k3d or kind | A real local cluster and ingress. Closest to production, highest cost. |
| Shared dev cluster | Per-branch namespaces on a remote cluster. Realistic, slow feedback. |

**Answer:** Local proxy plus `next dev`.

**What it drove:** `tools/app.ts` starts each app, generates the Caddyfile from the registry,
and waits for readiness. The spike confirmed that HMR works through the proxy because the
dev client shares the zone's asset prefix.

## 13. How are zone routes registered and deployed?

| Option | Description |
| --- | --- |
| Single registry file (recommended) | One config generates the local proxy and the Kubernetes Ingress, validated in CI. |
| Platform team owns ingress | Teams request routes and the platform edits ingress manually. |
| Runtime discovery | Zones register via annotations or a service registry. |
| Shell owns routes | The shell holds the table and proxies. Central control, but a single point of failure. |

**Answer:** Single registry file.

**What it drove:** `packages/routing/src/zones.ts` is the source of truth for paths,
ports, asset prefixes, navigation, the local edge, the Ingress, and the tests. Segment-safe
matching and collision checks live with it.

## 14. How many zones should the PoC have, and what should they demonstrate?

| Option | Description |
| --- | --- |
| Shell plus 2 realistic zones (recommended) | One content flow and one form-heavy flow. |
| Shell plus 1 zone | Minimum to prove routing and deploy. |
| Shell plus 2 zones plus 1 non-Next zone | Adds a framework-agnostic boundary. |
| Shell plus 3 or more zones | Proves registry and nav scale, more to maintain. |

**Answer:** Shell plus 2 zones plus 1 non-Next zone.

**What it drove:** shell, catalog (list, detail, filters), operations (form, Server Action,
audit), and reports (Vite SPA). The third zone proves the edge is not Next-specific.

## 15. What should the zones talk to for data in the PoC?

| Option | Description |
| --- | --- |
| Shared mock API service (recommended) | One small HTTP service with real fetch, loading, error, and auth headers. |
| Mock data inside each zone | Fast, but no contract or error-state testing. |
| Real backend services | Most realistic, adds auth and environment setup. |
| No data at all | Static pages only. |

**Answer:** Shared mock API service.

**What it drove:** `apps/mock-api` with Hono and Zod. Schemas are shared through
`packages/api`, so the service and every zone parse the same contract. It also gave the demo
latency, error states, and a failure switch.

## 16. Which of these must the demo prove to call the PoC a success?

*Select all that apply.*

| Option | Description |
| --- | --- |
| Independent deploy | Ship one zone without rebuilding the shell or other zones. |
| Failure isolation | Kill one zone; the rest keeps serving. |
| Independent scaling | Scale one zone's replicas independently. |
| Consistent UX | Header, nav, theme, and error states are identical everywhere. |
| Cheap onboarding | Adding a zone is a small documented step. |
| Shared session | Sign in once, stay signed in across zones. |

**Answer:** Independent deploy, failure isolation, consistent UX, shared session.

**What it drove:** `pnpm ship` and `pnpm stop`, the edge 503 page, the shared `AppShell`,
and the E2E auth suite. Independent scaling and cheap onboarding were explicitly not
gating, though the registry makes onboarding small anyway.

## 17. How should each zone serve its build assets?

| Option | Description |
| --- | --- |
| Per-zone asset hostname (recommended) | `assets-sales.example.com`. Clean isolation, needs wildcard DNS and a cert. |
| Path-prefixed on the same domain | `/_assets/sales`, routed by ingress. No extra DNS. |
| Upload to object storage or CDN | S3/CloudFront. Best performance, extra pipeline. |
| Decide during the PoC | Start simple and settle it before production. |

**Answer:** Path-prefixed on the same domain.

**What it drove:** `assetPrefix: "/_assets/<zone>"` on Next zones and a dedicated edge
route per zone. The spike found that the image optimizer already lives under the zone's
`basePath` (`/catalog/_next/image`), so it needed no extra prefix. The Vite zone serves
everything under `/reports`.

## 18. How should the global navigation stay in sync with independently deployed zones?

| Option | Description |
| --- | --- |
| Build-time registry (recommended) | Each zone bundles the nav. No runtime dependency; stale zones show stale nav. |
| Runtime nav API | Always current, but every zone depends on the shell at runtime. |
| Hybrid | Build-time fallback plus a best-effort refresh. |
| Coordinated nav releases | Nav changes ship in lockstep across zones. |

**Answer:** Build-time registry.

**What it drove:** `navZones()` is bundled per zone. The build badge in the footer exposes
version skew. This preserved failure isolation: a zone never calls the shell for chrome.

## 19. Where must the success demo actually run?

| Option | Description |
| --- | --- |
| Local proxy is enough (recommended) | Local processes or containers behind Caddy. |
| Local k3d or kind cluster | Real ingress and manifests. |
| Shared staging cluster | Most realistic, needs platform access and CI/CD. |
| Local now, staging later | Build and demo locally, deploy to staging after agreement. |

**Answer:** Local proxy is enough.

**What it drove:** the Caddy edge, the generated 503 page, and the local process manager.
The Kubernetes Ingress is generated and documented, but not exercised in the demo.

## 20. How much time do we have for the PoC?

| Option | Description |
| --- | --- |
| About one week | Shell, two Next zones, one non-Next zone, shared UI, routing, local demo. |
| Two to three days | Thin slices only. |
| Two weeks or more | Room for Storybook, auth adapter, observability, CI, staging. |
| No fixed deadline | Ship it properly and stop when the architecture question is answered. |

**Answer:** No fixed deadline.

**What it drove:** the build went beyond the minimum: Storybook, a real design system,
nine unit tests, thirteen E2E tests, generated Ingress tests, and four docs. It also made
the visual polish and accessibility work affordable.

## 21. What should the non-Next zone be?

| Option | Description |
| --- | --- |
| Vite React SPA (recommended) | Different build system, its own assets, client-side routing. |
| Static HTML | A tiny static site. Minimal effort. |
| Express plus EJS | Server-rendered legacy style. |
| Decide later | Start with a placeholder. |

**Answer:** Vite React SPA.

**What it drove:** `apps/zone-reports` with Wouter, a Vite base of `/reports/`, and the
same shared chrome. The edge rewrites the bare `/reports` path to `/reports/` so the URL
stays canonical. It proves the boundary is framework-agnostic.

## 22. What should the shared design system be built on?

| Option | Description |
| --- | --- |
| Tailwind plus Radix primitives (recommended) | Owned components, accessible primitives, CSS compiled per zone. |
| Tailwind plus custom components | Full control, more accessibility work. |
| CSS Modules plus design tokens | Scoped styles, more ceremony. |
| MUI, Mantine, or Chakra | Fast to a polished look, heavier and harder to own. |

**Answer:** Tailwind plus Radix primitives.

**What it drove:** `@micro/ui` owns the tokens and components. Each zone compiles its own
CSS from shared source, so there is no global CSS collision. Radix supplies the dropdown,
avatar, and slot behavior. Storybook lives in the UI package.

---

## Questions we did not ask

These surfaced during implementation or were deliberately deferred. They are recorded here
so the gaps are explicit rather than accidental.

| Gap | Current posture |
| --- | --- |
| Real SSO mechanism | Open. `packages/auth` is the seam; the PoC uses forward-auth headers. |
| 404 status behavior | Not asked. `notFound()` streams with a 200 in this setup; the page is `noindex`. Production options are in `docs/decisions.md` #11. |
| Analytics, sitemap, canonical URLs | Not asked. Each zone owns its metadata; no analytics vendor is wired. |
| Observability | Not asked. No tracing, metrics, or log aggregation. The edge and app logs are local files. |
| i18n | Not asked. No locale routing. |
| Real database or secrets | Not asked. The mock API is in memory. |
| Shell failure | The edge 503 page covers an upstream failure. If the edge itself dies, nothing is served; production needs a redundant ingress. |
| Resource limits and autoscaling | Independent scaling was not a success criterion. The Kubernetes manifests are a reference only. |
| Visual regression testing | Not asked. Playwright covers behavior and some layout, but there is no screenshot baseline. |
| Component governance | Not asked. The design system is owned, but there is no deprecation or contribution process yet. |

## How to use this document

- Read it with `docs/architecture.md` to see how each answer became a mechanism.
- Read `docs/decisions.md` for the tradeoffs and the accepted costs.
- If a future requirement changes an answer here, update the decision record and the
  registry together. The registry is the part of this document that executes.
