"use client";

import type { OpsSettings } from "@micro/api";
import {
  Button,
  Card,
  Field,
  Input,
  RadioCard,
  Switch,
} from "@micro/ui";
import { CircleCheck, Info, Save, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { saveSettings, type SaveState } from "./actions";

const strategies = [
  {
    value: "fastest",
    title: "Fastest",
    description: "Minimise transit time. Highest cost, best promise.",
    badge: null,
  },
  {
    value: "cheapest",
    title: "Cheapest",
    description: "Consolidate and wait for the next linehaul.",
    badge: null,
  },
  {
    value: "balanced",
    title: "Balanced",
    description: "Blend cost and speed against the SLA target.",
    badge: "Default",
  },
] as const;

export function SettingsForm({ initial }: { initial: OpsSettings }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    saveSettings,
    null,
  );
  const [strategy, setStrategy] = useState(initial.routingStrategy);
  const [autoReroute, setAutoReroute] = useState(initial.autoReroute);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state ? (
        <div
          role="status"
          className={
            state.ok
              ? "flex items-start gap-2 rounded-xl border border-success/20 bg-success-soft px-4 py-3 text-sm text-success"
              : "flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
          }
        >
          {state.ok ? (
            <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          ) : (
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Routing strategy</h2>
            <p className="mt-1 text-xs text-ink-mute">
              How the dispatch engine trades cost against transit time.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {strategies.map((option) => (
            <RadioCard
              key={option.value}
              name="routingStrategy"
              value={option.value}
              checked={strategy === option.value}
              onChange={(value) => setStrategy(value as OpsSettings["routingStrategy"])}
              title={option.title}
              description={option.description}
              badge={
                option.badge ? (
                  <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-ink-mute ring-1 ring-line">
                    {option.badge}
                  </span>
                ) : null
              }
            />
          ))}
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <div>
          <h2 className="text-sm font-semibold">Dispatch thresholds</h2>
          <p className="mt-1 text-xs text-ink-mute">
            These values feed the same API the reports zone reads.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Same-day cutoff"
            htmlFor="cutoffTime"
            hint="Local time. Orders after this roll to the next day."
            error={state?.fieldErrors?.cutoffTime}
          >
            <Input
              id="cutoffTime"
              name="cutoffTime"
              type="time"
              defaultValue={initial.cutoffTime}
              required
            />
          </Field>

          <Field
            label="On-time target"
            htmlFor="slaThreshold"
            hint="Between 50% and 100%. Alerts fire below this value."
            error={state?.fieldErrors?.slaThreshold}
          >
            <div className="relative">
              <Input
                id="slaThreshold"
                name="slaThreshold"
                type="number"
                min={50}
                max={100}
                step={1}
                defaultValue={initial.slaThreshold}
                required
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">
                %
              </span>
            </div>
          </Field>
        </div>

        <div className="border-t border-line pt-4">
          <Switch
            name="autoReroute"
            checked={autoReroute}
            onChange={setAutoReroute}
            label="Automatic re-route"
            description="When a hub reports a delay over 20 minutes, move affected parcels to the next best lane."
          />
        </div>

        <Field
          label="Escalation contacts"
          htmlFor="escalationEmails"
          hint="Comma-separated email addresses. They receive every SLA breach."
          error={state?.fieldErrors?.escalationEmails}
        >
          <Input
            id="escalationEmails"
            name="escalationEmails"
            type="text"
            defaultValue={initial.escalationEmails.join(", ")}
            placeholder="ops-lead@relay.example, dispatch@relay.example"
          />
        </Field>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-mute">
          <Info aria-hidden className="size-3.5" />
          Saving posts a Server Action to this zone only.
        </p>
        <Button type="submit" variant="accent" disabled={pending}>
          <Save aria-hidden className="size-4" />
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
