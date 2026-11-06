import { navZones } from "@micro/routing";
import type { ReactNode } from "react";
import { Badge, Container, Dot } from "./surface";
import { LogoMark, Wordmark } from "./logo";
import type { BuildInfo, LinkComponent, LinkComponentProps } from "./types";
import { UserMenu } from "./user-menu";
import { cn } from "./utils";

function AnchorLink({ href, children, ...props }: LinkComponentProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

function NavTab({
  item,
  active,
  Link,
  compact = false,
}: {
  item: ReturnType<typeof navZones>[number];
  active: boolean;
  Link: LinkComponent;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.path}
      aria-current={active ? "page" : undefined}
      data-zone={item.id}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-surface text-ink shadow-card ring-1 ring-line"
          : "text-ink-soft hover:bg-surface/70 hover:text-ink",
      )}
    >
      {compact ? item.shortLabel : item.label}
    </Link>
  );
}

export function AppShell({
  zone,
  build,
  children,
  linkComponent,
}: {
  zone: { id: string };
  build?: BuildInfo;
  children: ReactNode;
  linkComponent?: LinkComponent;
}) {
  const Link = linkComponent ?? AnchorLink;
  const items = navZones();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-pop"
      >
        Skip to content
      </a>

      <header className="site-header sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-md">
        <Container className="flex h-16 items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Relay home">
            <LogoMark />
            <Wordmark />
          </Link>

          <nav aria-label="Primary" className="ml-2 hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <NavTab key={item.id} item={item} active={item.id === zone.id} Link={Link} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Badge className="hidden sm:inline-flex">
              <Dot tone="success" />
              PoC
            </Badge>
            <UserMenu />
          </div>
        </Container>

        <Container className="md:hidden">
          <nav aria-label="Primary" className="-mx-1 flex gap-1 overflow-x-auto pb-3">
            {items.map((item) => (
              <NavTab
                key={item.id}
                item={item}
                active={item.id === zone.id}
                Link={Link}
                compact
              />
            ))}
          </nav>
        </Container>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="site-footer border-t border-line/80">
        <Container className="flex flex-col gap-2 py-7 text-xs text-ink-mute sm:flex-row sm:items-center sm:justify-between">
          <p>Relay delivery platform · proof of concept</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              zone{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-ink-soft ring-1 ring-line">
                {zone.id}
              </code>
            </span>
            {build ? (
              <>
                <span aria-hidden className="text-line-strong">
                  /
                </span>
                <span>
                  {build.app} <span className="text-line-strong">@</span> {build.version}{" "}
                  <span className="text-line-strong">({build.mode})</span>
                </span>
              </>
            ) : null}
          </div>
        </Container>
      </footer>
    </div>
  );
}
