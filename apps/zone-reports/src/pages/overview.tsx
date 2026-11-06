import {
  Button,
  Card,
  Container,
  ErrorState,
  PageHeader,
  SectionHeading,
  Skeleton,
  SkeletonCard,
  StatCard,
} from "@micro/ui";
import {
  Activity,
  ArrowUpRight,
  Gauge,
  Package,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { api } from "../api";
import { useAsync } from "../hooks";
import { ReportsLink } from "../zone-link";
import { VolumeChart } from "../components/chart";
import { CourierList } from "../components/courier-list";

export function OverviewPage() {
  const summary = useAsync(() => api.reports.summary(), []);
  const series = useAsync(() => api.reports.timeseries(), []);
  const couriers = useAsync(() => api.reports.couriers(), []);

  const loading = summary.loading || series.loading || couriers.loading;
  const error = summary.error ?? series.error ?? couriers.error;

  if (error) {
    return (
      <Container className="py-10">
        <PageHeader eyebrow="Reports zone · Vite" title="Delivery reports" />
        <ErrorState
          className="mt-8"
          title="Reports could not load"
          description={error}
          action={
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <PageHeader
        eyebrow="Reports zone · Vite"
        title="Delivery reports"
        description="Volume, on-time performance and courier load across the network."
        actions={
          <>
            <div className="inline-flex items-center rounded-full border border-line bg-surface p-0.5 text-xs">
              <span className="rounded-full bg-ink px-3 py-1.5 font-medium text-white">
                14 days
              </span>
              <span className="px-3 py-1.5 text-ink-mute" title="Not part of the PoC">
                30 days
              </span>
            </div>
            <Button asChild variant="secondary">
              <ReportsLink href="/reports/couriers">
                Courier load
                <ArrowUpRight aria-hidden className="size-4" />
              </ReportsLink>
            </Button>
          </>
        }
      />

      {loading || !summary.data ? (
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} rows={2} />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="On-time"
            value={summary.data.onTime.toFixed(1)}
            suffix="%"
            delta={`+${summary.data.deltas.onTime} pts`}
            deltaTone="positive"
            hint={summary.data.window}
            icon={<Gauge aria-hidden className="size-4" />}
          />
          <StatCard
            label="Parcels"
            value={summary.data.volume.toLocaleString("en-GB")}
            delta={`+${summary.data.deltas.volume}%`}
            deltaTone="positive"
            hint="vs previous period"
            icon={<Package aria-hidden className="size-4" />}
          />
          <StatCard
            label="Incidents"
            value={summary.data.incidents}
            delta={`${summary.data.deltas.incidents}`}
            deltaTone="positive"
            hint="open"
            icon={<TriangleAlert aria-hidden className="size-4" />}
          />
          <StatCard
            label="Cost / parcel"
            value={`€${summary.data.costPerParcel.toFixed(2)}`}
            delta={`${summary.data.deltas.costPerParcel.toFixed(2)}`}
            deltaTone="positive"
            hint="blended"
            icon={<Wallet aria-hidden className="size-4" />}
          />
        </div>
      )}

      <Card className="mt-5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Daily volume</h2>
            <p className="mt-1 text-xs text-ink-mute">
              Parcels moved per day. Weekends dip; the Black Friday ramp is visible.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-ink-mute">
            <span className="size-2 rounded-full bg-accent" />
            parcels / day
          </div>
        </div>
        <div className="mt-4">
          {series.loading || !series.data ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <VolumeChart data={series.data} />
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <Card className="p-5">
          <SectionHeading
            title="Courier load"
            description="Top performers by parcels moved this period."
            action={
              <ReportsLink
                href="/reports/couriers"
                className="whitespace-nowrap text-xs font-medium text-accent hover:underline"
              >
                View all
              </ReportsLink>
            }
          />
          {couriers.loading || !couriers.data ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <CourierList
              couriers={couriers.data
                .slice()
                .sort((a, b) => b.deliveries - a.deliveries)
                .slice(0, 5)}
            />
          )}
        </Card>

        <Card className="p-5">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
            <Activity aria-hidden className="size-3.5 text-accent" />
            This zone is a Vite SPA
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            It shares the chrome, tokens and session with the Next zones, but not the Next
            runtime. Everything here is client-rendered and calls the same <code>/api</code>.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-ink-mute">
            <li>• Served from <code>/reports</code> with Vite's base path</li>
            <li>• Client-side routes handled by Wouter</li>
            <li>• Assets live under <code>/reports/assets</code></li>
            <li>• Cross-zone links are full navigations</li>
          </ul>
          <div className="mt-4 rounded-lg bg-canvas p-3 font-mono text-[11px] leading-5 text-ink-soft">
            <p>zone: reports</p>
            <p>framework: vite 8</p>
            <p>build: {__BUILD_INFO__}</p>
          </div>
        </Card>
      </div>
    </Container>
  );
}
