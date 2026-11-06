import {
  Button,
  Card,
  Container,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
} from "@micro/ui";
import { ArrowLeft, Search, Truck, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../api";
import { useAsync } from "../hooks";
import { ReportsLink } from "../zone-link";
import { CourierList } from "../components/courier-list";

export function CouriersPage() {
  const couriers = useAsync(() => api.reports.couriers(), []);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!couriers.data) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return couriers.data;
    return couriers.data.filter((courier) =>
      `${courier.name} ${courier.hub}`.toLowerCase().includes(needle),
    );
  }, [couriers.data, query]);

  const stats = useMemo(() => {
    if (!couriers.data?.length) return { deliveries: 0, onTime: 0, active: 0 };
    const deliveries = couriers.data.reduce((sum, courier) => sum + courier.deliveries, 0);
    const onTime =
      couriers.data.reduce((sum, courier) => sum + courier.onTime, 0) / couriers.data.length;
    const active = couriers.data.filter((courier) => courier.status === "active").length;
    return { deliveries, onTime, active };
  }, [couriers.data]);

  return (
    <Container className="py-10">
      <PageHeader
        eyebrow="Reports zone · Vite"
        title="Courier load"
        description="Per-courier volume and on-time performance for the current period."
        actions={
          <Button asChild variant="secondary">
            <ReportsLink href="/reports">
              <ArrowLeft aria-hidden className="size-4" />
              Back to overview
            </ReportsLink>
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Parcels moved"
          value={couriers.loading ? "—" : stats.deliveries.toLocaleString("en-GB")}
          icon={<Truck aria-hidden className="size-4" />}
        />
        <StatCard
          label="Average on-time"
          value={couriers.loading ? "—" : stats.onTime.toFixed(1)}
          suffix="%"
          icon={<UserRoundCheck aria-hidden className="size-4" />}
        />
        <StatCard
          label="Active now"
          value={couriers.loading ? "—" : stats.active}
          hint={`of ${couriers.data?.length ?? 0}`}
        />
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Couriers</h2>
            <p className="mt-0.5 text-xs text-ink-mute">
              Filtered client-side. No round trip, no server rendering.
            </p>
          </div>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-mute"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by name or hub…"
              aria-label="Filter couriers"
              className="h-9 w-full rounded-full border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-mute/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 sm:w-64"
            />
          </div>
        </div>

        {couriers.error ? (
          <div className="p-4">
            <ErrorState
              title="Courier data could not load"
              description={couriers.error}
              action={
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  Reload
                </Button>
              }
            />
          </div>
        ) : couriers.loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-mute">
            No couriers match “{query}”.
          </p>
        ) : (
          <div className="pt-1">
            <CourierList couriers={filtered} />
          </div>
        )}
      </Card>
    </Container>
  );
}
