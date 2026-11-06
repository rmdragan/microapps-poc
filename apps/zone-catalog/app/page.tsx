import { type CatalogItem } from "@micro/api";
import { createServerApi } from "@micro/api/server";
import {
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  PageHeader,
  SectionHeading,
} from "@micro/ui";
import { ZoneLink } from "@micro/ui/next";
import { ArrowRight, ArrowUpRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { headers } from "next/headers";
import { catalogHref, money, slaLabel, statusLabel, statusTone } from "../lib/catalog";

export const metadata = { title: "Service catalog" };

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
}>;

function ServiceCard({ item }: { item: CatalogItem }) {
  return (
    <ZoneLink
      href={`/catalog/${item.id}`}
      className="group flex flex-col rounded-card border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone="neutral">{item.category}</Badge>
        <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
      </div>

      <h3 className="mt-3.5 flex items-start justify-between gap-2 text-[17px] font-semibold leading-6 text-ink">
        {item.name}
        <ArrowUpRight
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-ink-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </h3>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{item.tagline}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-mute">
        <MapPin aria-hidden className="size-3.5" />
        {item.regions.slice(0, 2).join(" · ")}
        {item.regions.length > 2 ? ` +${item.regions.length - 2}` : ""}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink-mute">SLA</p>
          <p className="mt-0.5 font-medium text-ink">{slaLabel(item.slaHours)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink-mute">From</p>
          <p className="mt-0.5 font-medium text-ink">
            {item.priceFrom === 0 ? "Pilot" : money(item.priceFrom)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink-mute">On-time</p>
          <p className="mt-0.5 font-medium text-ink">{item.metrics.onTime.toFixed(1)}%</p>
        </div>
      </div>
    </ZoneLink>
  );
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const category = params.category ?? "";
  const sort = params.sort ?? "relevance";
  const page = Number(params.page ?? "1") || 1;

  const api = createServerApi(await headers());
  const data = await api.catalog.list({ q, category, sort, page });

  return (
    <Container className="py-10">
      <PageHeader
        eyebrow="Catalog zone · Next.js"
        title="Service catalog"
        description="Every delivery service Relay can sell, with the SLA and coverage each one actually promises."
        actions={
          <>
            <Button asChild variant="secondary">
              <ZoneLink href="/ops">Open operations</ZoneLink>
            </Button>
            <Button asChild variant="accent">
              <ZoneLink href="/reports">
                View demand
                <ArrowUpRight aria-hidden className="size-4" />
              </ZoneLink>
            </Button>
          </>
        }
      />

      <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <ZoneLink
            href={catalogHref({ q, sort })}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              category
                ? "border-line bg-surface text-ink-soft hover:border-line-strong"
                : "border-ink bg-ink text-white"
            }`}
          >
            All services
          </ZoneLink>
          {data.facets.map((facet) => {
            const active = category === facet.category;
            return (
              <ZoneLink
                key={facet.category}
                href={catalogHref({ q, sort, category: active ? undefined : facet.category })}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-surface text-ink-soft hover:border-line-strong"
                }`}
              >
                {facet.category}
                <span className={active ? "ml-1.5 text-white/60" : "ml-1.5 text-ink-mute"}>
                  {facet.count}
                </span>
              </ZoneLink>
            );
          })}
        </div>

        <form method="get" className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <label className="sr-only" htmlFor="catalog-search">
            Search services
          </label>
          <div className="relative w-full sm:w-56">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-mute"
            />
            <input
              id="catalog-search"
              name="q"
              defaultValue={q}
              placeholder="Search services…"
              className="h-9 w-full rounded-full border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-mute/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <label className="sr-only" htmlFor="catalog-sort">
            Sort
          </label>
          <div className="relative">
            <SlidersHorizontal
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-mute"
            />
            <select
              id="catalog-sort"
              name="sort"
              defaultValue={sort}
              className="h-9 appearance-none rounded-full border border-line-strong bg-surface pl-8 pr-7 text-xs font-medium text-ink-soft focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
            >
              <option value="relevance">Relevance</option>
              <option value="sla">Fastest SLA</option>
              <option value="price">Lowest price</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Apply
          </Button>
        </form>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-mute">
          {data.total} service{data.total === 1 ? "" : "s"}
          {q ? ` matching “${q}”` : ""}
          {category ? ` in ${category}` : ""}
        </p>
        {q || category ? (
          <ZoneLink href="/catalog" className="text-xs font-medium text-accent hover:underline">
            Clear filters
          </ZoneLink>
        ) : null}
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          className="mt-5"
          title="No services match those filters"
          description="Try a broader search, or clear the category filter to see the full catalog."
          action={
            <Button asChild variant="secondary">
              <ZoneLink href="/catalog">Clear filters</ZoneLink>
            </Button>
          }
        />
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((item) => (
            <ServiceCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {data.pageCount > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-between border-t border-line pt-5"
        >
          <p className="text-xs text-ink-mute">
            Page {data.page} of {data.pageCount}
          </p>
          <div className="flex items-center gap-2">
            {data.page > 1 ? (
              <Button asChild variant="secondary" size="sm">
                <ZoneLink href={catalogHref({ q, category, sort, page: data.page - 1 })}>
                  Previous
                </ZoneLink>
              </Button>
            ) : null}
            {data.page < data.pageCount ? (
              <Button asChild variant="secondary" size="sm">
                <ZoneLink href={catalogHref({ q, category, sort, page: data.page + 1 })}>
                  Next
                  <ArrowRight aria-hidden className="size-3.5" />
                </ZoneLink>
              </Button>
            ) : null}
          </div>
        </nav>
      ) : null}

      <section className="mt-12">
        <SectionHeading
          title="How the catalog zone is wired"
          description="A normal Next.js app. The public prefix comes from the route registry, not from folder names."
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="font-mono text-[11px] text-accent">basePath</p>
            <p className="mt-1 text-sm text-ink-soft">
              The app writes <code>/</code> and <code>/{`{id}`}</code>. Next adds{" "}
              <code>/catalog</code>.
            </p>
          </Card>
          <Card className="p-4">
            <p className="font-mono text-[11px] text-accent">assetPrefix</p>
            <p className="mt-1 text-sm text-ink-soft">
              Chunks and CSS live under <code>/_assets/catalog/*</code>, so no two zones share
              a <code>/_next</code> path.
            </p>
          </Card>
          <Card className="p-4">
            <p className="font-mono text-[11px] text-accent">data</p>
            <p className="mt-1 text-sm text-ink-soft">
              Server components call the shared API and forward the edge identity headers.
            </p>
          </Card>
        </div>
      </section>
    </Container>
  );
}
