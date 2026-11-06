import { ChevronRight } from "lucide-react";
import type { LinkComponent } from "./types";

function AnchorLink({
  href,
  children,
  ...props
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

export function Breadcrumbs({
  items,
  linkComponent,
}: {
  items: Array<{ label: string; href?: string }>;
  linkComponent?: LinkComponent;
}) {
  const Link = linkComponent ?? AnchorLink;
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-ink-mute">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? (
              <ChevronRight aria-hidden className="size-3.5 text-line-strong" />
            ) : null}
            {item.href ? (
              <Link href={item.href} className="rounded transition-colors hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink-soft">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
