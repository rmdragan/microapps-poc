import { initials } from "@micro/auth/headers";
import { cn } from "./utils";

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-7 text-[10px]",
    md: "size-8 text-[11px]",
    lg: "size-11 text-sm",
  };
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full bg-accent-soft font-semibold uppercase tracking-wide text-accent-strong ring-1 ring-accent/15",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
