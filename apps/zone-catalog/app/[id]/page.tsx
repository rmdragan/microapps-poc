import { ApiError } from "@micro/api";
import { createServerApi } from "@micro/api/server";
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Dot,
  PageHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@micro/ui";
import { ZoneLink } from "@micro/ui/next";
import { ArrowLeft, ArrowUpRight, CircleCheck, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { money, slaLabel, statusLabel, statusTone } from "../../lib/catalog";

type Params = Promise<{ id: string }>;

async function loadItem(id: string) {
  const api = createServerApi(await headers());
  return api.catalog.get(id);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const item = await loadItem(id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  return { title: item.name, description: item.tagline };
}

export default async function ServicePage({ params }: { params: Params }) {
  const { id } = await params;
  const item = await loadItem(id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  const updated = new Date(item.updatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Container className="py-10">
      <Breadcrumbs
        linkComponent={ZoneLink}
        items={[{ label: "Service catalog", href: "/catalog" }, { label: item.name }]}
      />

      <PageHeader
        className="mt-5"
        eyebrow={
          <span className="inline-flex items-center gap-2">
            {item.category}
            <span aria-hidden className="text-line-strong">
              /
            </span>
            <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
          </span>
        }
        title={item.name}
        description={item.tagline}
        actions={
          <>
            <Button asChild variant="ghost">
              <ZoneLink href="/catalog">
                <ArrowLeft aria-hidden className="size-4" />
                Back to catalog
              </ZoneLink>
            </Button>
            <Button asChild variant="accent">
              <ZoneLink href="/ops">
                Open operations
                <ArrowUpRight aria-hidden className="size-4" />
              </ZoneLink>
            </Button>
          </>
        }
      />

      <div className="relative mt-6 h-24 overflow-hidden rounded-card bg-ink">
        <svg
          viewBox="0 0 1200 96"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <pattern id="route-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="rgba(255,255,255,0.07)" />
            </pattern>
            <linearGradient id="route-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#cf4a0c" stopOpacity="0" />
              <stop offset="0.22" stopColor="#cf4a0c" stopOpacity="1" />
              <stop offset="1" stopColor="#f59e0b" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <rect width="1200" height="96" fill="url(#route-dots)" />
          <path
            d="M-20 72 C 160 72 220 28 400 28 S 660 78 840 52 S 1080 24 1220 44"
            stroke="url(#route-line)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M-20 86 C 200 86 280 56 460 56 S 720 90 900 72 S 1100 50 1220 62"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 6"
          />
          <circle cx="400" cy="28" r="3.5" fill="#f59e0b" />
          <circle cx="840" cy="52" r="3.5" fill="#cf4a0c" />
          <circle cx="460" cy="56" r="2.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="900" cy="72" r="2.5" fill="rgba(255,255,255,0.6)" />
        </svg>
        <div className="relative flex h-full items-center justify-between gap-4 px-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
              Metro network
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              {item.regions.length} regions · {slaLabel(item.slaHours)} promise
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] text-white/75">
            {item.category}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-base font-semibold">About this service</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">{item.description}</p>

            <h3 className="mt-6 text-sm font-semibold">What is included</h3>
            <ul className="mt-2 space-y-2">
              {item.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2 text-sm text-ink-soft">
                  <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                  {highlight}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold">Performance</h2>
            <p className="mt-1 text-xs text-ink-mute">
              Rolling 14-day view from the operations data service.
            </p>
            <div className="mt-4">
              <Table>
                <THead>
                  <TR>
                    <TH>Metric</TH>
                    <TH className="text-right">Value</TH>
                  </TR>
                </THead>
                <TBody>
                  <TR>
                    <TD className="text-ink-soft">On-time delivery</TD>
                    <TD className="text-right font-medium">
                      {item.metrics.onTime.toFixed(1)}%
                    </TD>
                  </TR>
                  <TR>
                    <TD className="text-ink-soft">Parcels moved</TD>
                    <TD className="text-right font-medium">
                      {item.metrics.volume.toLocaleString("en-GB")}
                    </TD>
                  </TR>
                  <TR>
                    <TD className="text-ink-soft">Open incidents</TD>
                    <TD className="text-right font-medium">{item.metrics.incidents}</TD>
                  </TR>
                </TBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-xs font-medium text-ink-mute">Commercials</p>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight">
              {item.priceFrom === 0 ? "Pilot" : money(item.priceFrom)}
            </p>
            <p className="mt-1 text-xs text-ink-mute">
              {item.priceFrom === 0 ? "no charge during the pilot" : `per ${item.priceUnit}`}
            </p>

            <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-mute">SLA</dt>
                <dd className="font-medium">{slaLabel(item.slaHours)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-mute">Coverage</dt>
                <dd className="font-medium">{item.regions.length} regions</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-mute">Updated</dt>
                <dd className="font-medium">{updated}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-medium text-ink-mute">Coverage</p>
            <ul className="mt-3 space-y-2">
              {item.regions.map((region) => (
                <li key={region} className="flex items-center gap-2 text-sm text-ink-soft">
                  <MapPin aria-hidden className="size-4 text-ink-mute" />
                  {region}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-medium text-ink-mute">Zone ownership</p>
            <p className="mt-2 text-sm text-ink-soft">
              Served by the catalog zone at <code>/catalog</code>, deployed independently of
              the shell and the other zones.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-ink-mute">
              <Dot tone="success" />
              recorded in the route registry
            </p>
          </Card>
        </div>
      </div>
    </Container>
  );
}
