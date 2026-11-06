import { createServerApi } from "@micro/api/server";
import { zones } from "@micro/routing";
import {
  Badge,
  Button,
  Card,
  Container,
  Dot,
  SectionHeading,
  StatCard,
} from "@micro/ui";
import { ZoneLink } from "@micro/ui/next";
import { ArrowUpRight, Boxes, CircleCheck, Gauge, PackageCheck, TriangleAlert } from "lucide-react";
import { headers } from "next/headers";

export default async function HomePage() {
  const api = createServerApi(await headers());
  const [summary, catalog, health] = await Promise.all([
    api.reports.summary().catch(() => null),
    api.catalog.list({ page: 1 }).catch(() => null),
    api.health().catch(() => null),
  ]);

  const navZones = zones.filter((zone) => zone.id !== "shell");

  return (
    <Container className="py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Platform overview
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-[44px]">
            One delivery platform.
            <br />
            <span className="text-ink-soft">Four teams shipping on their own schedule.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-ink-soft">
            Relay is a proof of concept for independent delivery zones. Every zone is a
            separately deployed application under one domain, with shared chrome, a shared
            design system, and a shared session.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button asChild variant="accent">
              <ZoneLink href="/catalog">
                Explore the service catalog
                <ArrowUpRight aria-hidden className="size-4" />
              </ZoneLink>
            </Button>
            <Button asChild variant="secondary">
              <ZoneLink href="/reports">Open reports</ZoneLink>
            </Button>
            <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-ink-mute">
              <Dot tone={health ? "success" : "warning"} />
              {health ? "All services responding" : "Mock API unreachable"}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="On-time"
              value={summary ? summary.onTime.toFixed(1) : "—"}
              suffix="%"
              delta={summary ? `+${summary.deltas.onTime} pts` : undefined}
              deltaTone="positive"
              hint="14 days"
              icon={<Gauge aria-hidden className="size-4" />}
            />
            <StatCard
              label="Parcels"
              value={summary ? summary.volume.toLocaleString("en-GB") : "—"}
              delta={summary ? `+${summary.deltas.volume}%` : undefined}
              deltaTone="positive"
              hint="14 days"
              icon={<PackageCheck aria-hidden className="size-4" />}
            />
            <StatCard
              label="Incidents"
              value={summary ? summary.incidents : "—"}
              delta={summary ? `${summary.deltas.incidents}` : undefined}
              deltaTone="positive"
              hint="open"
              icon={<TriangleAlert aria-hidden className="size-4" />}
            />
            <StatCard
              label="Services"
              value={catalog ? catalog.total : "—"}
              hint="in catalog"
              icon={<Boxes aria-hidden className="size-4" />}
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-ink">Edge routing</p>
              <p className="mt-0.5 text-[11px] text-ink-mute">
                One origin, four upstreams
              </p>
            </div>
            <Badge tone="success">
              <Dot tone="success" />
              live
            </Badge>
          </div>
          <div className="bg-ink px-4 py-4 font-mono text-[12px] leading-6 text-white/80">
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-baseline justify-between gap-3">
                <span className="text-white/50">{zone.path === "/" ? "/" : `${zone.path}/*`}</span>
                <span className="text-white/30">→</span>
                <span className="text-white">{zone.app}</span>
                <span className="w-10 text-right text-white/40">:{zone.port}</span>
              </div>
            ))}
            <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-white/10 pt-2">
              <span className="text-white/50">/api/*</span>
              <span className="text-white/30">→</span>
              <span className="text-white">mock-api</span>
              <span className="w-10 text-right text-white/40">:4000</span>
            </div>
          </div>
          <div className="space-y-2 px-4 py-4 text-xs leading-5 text-ink-soft">
            <p className="flex items-start gap-2">
              <CircleCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
              Assets live under each zone's own namespace, so <code>/_next</code> never collides.
            </p>
            <p className="flex items-start gap-2">
              <CircleCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
              The edge injects identity headers; zones never see the SSO cookie.
            </p>
          </div>
        </Card>
      </div>

      <section className="mt-14">
        <SectionHeading
          title="Zones"
          description="Each zone has its own team, pipeline and release cadence."
          action={
            <span className="hidden text-xs text-ink-mute sm:block">
              Navigating between zones is a document load
            </span>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {navZones.map((zone) => (
            <ZoneLink
              key={zone.id}
              href={zone.path}
              className="group flex flex-col rounded-card border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge tone="neutral">{zone.team} team</Badge>
                <span className="rounded-md border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-mute">
                  {zone.framework === "next" ? "next.js" : "vite"}
                </span>
              </div>
              <h3 className="mt-4 flex items-center gap-1.5 text-lg font-semibold text-ink">
                {zone.label}
                <ArrowUpRight
                  aria-hidden
                  className="size-4 text-ink-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-6 text-ink-soft">{zone.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
                <code className="text-[11px] text-ink-mute">{zone.path}</code>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-mute">
                  <Dot tone="success" />
                  operational
                </span>
              </div>
            </ZoneLink>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          title="What this proof of concept proves"
          description="The three properties that made Multi-Zones worth the complexity."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-wide text-accent">01 · deploy</p>
            <h3 className="mt-2 text-base font-semibold">Independent releases</h3>
            <p className="mt-1.5 text-sm leading-6 text-ink-soft">
              Ship the catalog without rebuilding the shell or any other zone. The footer
              shows the build each zone is actually running.
            </p>
          </Card>
          <Card className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-wide text-accent">02 · compose</p>
            <h3 className="mt-2 text-base font-semibold">Shared chrome, separate trees</h3>
            <p className="mt-1.5 text-sm leading-6 text-ink-soft">
              One design system renders the header everywhere. Cross-zone navigation is a
              hard navigation with view transitions, prefetching and a shared session.
            </p>
          </Card>
          <Card className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-wide text-accent">03 · fail</p>
            <h3 className="mt-2 text-base font-semibold">Isolated failure</h3>
            <p className="mt-1.5 text-sm leading-6 text-ink-soft">
              Take a zone down and the edge serves a branded 503 for that path only. The
              shell and every other zone keep serving.
            </p>
          </Card>
        </div>
      </section>

      <section className="mt-14">
        <Card className="flex flex-col gap-5 bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Try it from the terminal</h2>
            <p className="mt-1 text-sm text-white/60">
              Both commands act on one zone only. The rest of the platform stays untouched.
            </p>
          </div>
          <div className="space-y-2 font-mono text-[12px]">
            <p className="rounded-lg bg-white/10 px-3 py-2 text-white/90">
              <span className="text-accent">$</span> pnpm ship zone-catalog
            </p>
            <p className="rounded-lg bg-white/10 px-3 py-2 text-white/90">
              <span className="text-accent">$</span> pnpm stop zone-ops
            </p>
          </div>
        </Card>
      </section>
    </Container>
  );
}
