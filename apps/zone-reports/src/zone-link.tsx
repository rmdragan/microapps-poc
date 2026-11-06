import { matchZone, toLocalHref, zoneById } from "@micro/routing";
import type { LinkComponentProps } from "@micro/ui";
import { Link } from "wouter";

const zone = zoneById("reports");

const prefetched = new Set<string>();

function prefetch(href: string) {
  if (prefetched.has(href)) return;
  prefetched.add(href);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Wouter adapter for the shared chrome. Same-zone links stay client-side;
 * anything owned by another zone is a real anchor.
 */
export function ReportsLink({ href, children, ...props }: LinkComponentProps) {
  const target = matchZone(href);

  if (target.id !== "reports") {
    return (
      <a
        href={href}
        onMouseEnter={() => prefetch(href)}
        onFocus={() => prefetch(href)}
        {...props}
      >
        {children}
      </a>
    );
  }

  const local = toLocalHref(href, zone);

  return (
    <Link href={local} {...props}>
      {children}
    </Link>
  );
}
