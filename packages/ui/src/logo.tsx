import { cn } from "./utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-[10px] bg-ink text-white shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
        <path
          d="M5 12h9.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M11.5 6.5 18 12l-6.5 5.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="4.5" cy="12" r="2.1" fill="#FB923C" />
      </svg>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className="text-[15px] font-semibold tracking-tight text-ink">Relay</span>
      <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute lg:block">
        Delivery platform
      </span>
    </span>
  );
}
