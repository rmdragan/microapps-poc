import type { ReactNode } from "react";
import { Card } from "./surface";
import { cn } from "./utils";

type DeltaTone = "positive" | "negative" | "neutral";

const deltaTones: Record<DeltaTone, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-ink-mute",
};

export function StatCard({
  label,
  value,
  suffix,
  delta,
  deltaTone = "neutral",
  hint,
  icon,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  suffix?: ReactNode;
  delta?: ReactNode;
  deltaTone?: DeltaTone;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-mute">{label}</p>
        {icon ? <span className="text-ink-mute/70">{icon}</span> : null}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[26px] font-semibold leading-none tracking-tight text-ink">
          {value}
        </span>
        {suffix ? <span className="text-sm text-ink-mute">{suffix}</span> : null}
      </div>
      {delta || hint ? (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta ? <span className={cn("font-medium", deltaTones[deltaTone])}>{delta}</span> : null}
          {hint ? <span className="text-ink-mute">{hint}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}
