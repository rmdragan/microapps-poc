import { ZoneLink } from "@micro/ui/next";
import { cn } from "@micro/ui";

export function OpsTabs({ active }: { active: "rules" | "audit" }) {
  const items = [
    { id: "rules" as const, label: "Routing rules", href: "/ops" },
    { id: "audit" as const, label: "Audit trail", href: "/ops/audit" },
  ];

  return (
    <nav aria-label="Operations sections" className="flex items-center gap-1 border-b border-line">
      {items.map((item) => (
        <ZoneLink
          key={item.id}
          href={item.href}
          aria-current={active === item.id ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            active === item.id
              ? "border-ink text-ink"
              : "border-transparent text-ink-mute hover:border-line-strong hover:text-ink",
          )}
        >
          {item.label}
        </ZoneLink>
      ))}
    </nav>
  );
}
