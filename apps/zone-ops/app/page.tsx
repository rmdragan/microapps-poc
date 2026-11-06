import { createServerApi } from "@micro/api/server";
import {
  Avatar,
  Badge,
  Card,
  Container,
  Dot,
  PageHeader,
} from "@micro/ui";
import { Clock, ShieldCheck, Workflow } from "lucide-react";
import { headers } from "next/headers";
import { requireOpsSession } from "../lib/require-session";
import { OpsTabs } from "./ops-tabs";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Operations" };

const strategyLabel = {
  fastest: "Fastest",
  cheapest: "Cheapest",
  balanced: "Balanced",
} as const;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

export default async function OperationsPage() {
  await requireOpsSession();
  const api = createServerApi(await headers());
  const [settings, audit] = await Promise.all([api.ops.settings(), api.ops.audit()]);
  const latest = audit[0];

  return (
    <Container className="py-10">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            Operations zone · Next.js
            <Badge tone="danger">
              <ShieldCheck aria-hidden className="size-3" />
              signed-in only
            </Badge>
          </span>
        }
        title="Operations"
        description="Routing policy, dispatch thresholds and the audit trail for every change."
      />

      <div className="mt-6">
        <OpsTabs active="rules" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
        <SettingsForm initial={settings} />

        <div className="space-y-5">
          <Card className="p-5" data-testid="current-policy">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-mute">Current policy</p>
              <Dot tone="success" />
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-mute">Strategy</dt>
                <dd className="font-medium">{strategyLabel[settings.routingStrategy]}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-mute">Cutoff</dt>
                <dd className="font-medium">{settings.cutoffTime}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-mute">On-time target</dt>
                <dd className="font-medium">{settings.slaThreshold}%</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-mute">Auto re-route</dt>
                <dd className="font-medium">{settings.autoReroute ? "On" : "Off"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-mute">Escalations</dt>
                <dd className="font-medium">{settings.escalationEmails.length}</dd>
              </div>
            </dl>
          </Card>

          {latest ? (
            <Card className="p-5">
              <p className="text-xs font-medium text-ink-mute">Last change</p>
              <div className="mt-3 flex items-start gap-3">
                <Avatar name={latest.actor} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{latest.actor}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-soft">{latest.action}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-mute">
                    <Clock aria-hidden className="size-3" />
                    {formatDateTime(latest.at)}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="p-5">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
              <Workflow aria-hidden className="size-3.5 text-accent" />
              Where the request goes
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-soft">
              The form posts a Server Action to <code>/ops</code>. The edge routes it straight
              to this zone; the shell is not in the path. The action forwards the edge identity
              headers to the shared API.
            </p>
          </Card>
        </div>
      </div>
    </Container>
  );
}
