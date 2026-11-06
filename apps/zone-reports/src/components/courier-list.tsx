import type { Courier } from "@micro/api";
import { Avatar, Badge, Table, TBody, TD, TH, THead, TR } from "@micro/ui";

const statusTone = {
  active: "success",
  break: "warning",
  offline: "neutral",
} as const;

const statusLabel = {
  active: "Active",
  break: "On break",
  offline: "Offline",
} as const;

/**
 * Cards on phones, a table from `sm` up. The table was unreadable when squeezed
 * into a 390px viewport, and a horizontal scrollbar felt worse than a list.
 */
export function CourierList({ couriers }: { couriers: Courier[] }) {
  return (
    <>
      <div className="space-y-2 sm:hidden">
        {couriers.map((courier) => (
          <div
            key={courier.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
          >
            <Avatar name={courier.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{courier.name}</p>
              <p className="truncate text-[11px] text-ink-mute">
                {courier.hub} · {courier.deliveries} parcels
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium text-ink">{courier.onTime.toFixed(1)}%</p>
              <Badge tone={statusTone[courier.status]} className="mt-1">
                {statusLabel[courier.status]}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block">
        <Table>
          <THead>
            <TR>
              <TH>Courier</TH>
              <TH className="text-right">Parcels</TH>
              <TH className="text-right">On-time</TH>
              <TH className="text-right">Status</TH>
            </TR>
          </THead>
          <TBody>
            {couriers.map((courier) => (
              <TR key={courier.id}>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={courier.name} size="sm" />
                    <div>
                      <p className="font-medium text-ink">{courier.name}</p>
                      <p className="text-[11px] text-ink-mute">{courier.hub}</p>
                    </div>
                  </div>
                </TD>
                <TD className="text-right font-medium">{courier.deliveries}</TD>
                <TD className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-line lg:block">
                      <span
                        className="block h-full rounded-full bg-success"
                        style={{ width: `${courier.onTime}%` }}
                      />
                    </span>
                    <span>{courier.onTime.toFixed(1)}%</span>
                  </div>
                </TD>
                <TD className="text-right">
                  <Badge tone={statusTone[courier.status]}>{statusLabel[courier.status]}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
