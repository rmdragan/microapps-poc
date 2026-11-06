/**
 * The single source of truth for every zone in the platform.
 *
 * Everything that needs to know about zones - the dev proxy, the Kubernetes
 * ingress generator, navigation, and the process manager - derives from this
 * file. Adding a zone means adding one entry here.
 *
 * `path` is the public prefix. A zone with `path: "/catalog"` receives every
 * request for `/catalog` and `/catalog/*` and is configured with
 * `basePath: "/catalog"` so its internal routes are written as if it owned the
 * root. `assets` is the public prefix for the zone's immutable build output.
 */
export type ZoneFramework = "next" | "vite" | "node";

export type ZoneDefinition = {
  id: string;
  /** Label used in navigation and page titles. */
  label: string;
  /** Compact label for narrow viewports. */
  shortLabel: string;
  description: string;
  /** Public URL prefix. The shell owns "/". */
  path: string;
  /** Owning team, shown on the home page and in docs. */
  team: string;
  /** Workspace package name of the application. */
  app: string;
  /** Port used for local development and for the local proxy. */
  port: number;
  /** Public prefix for build assets. Next zones need this; the shell does not. */
  assets?: string;
  framework: ZoneFramework;
  /** Whether the zone appears in the global navigation. */
  nav: boolean;
  auth: "public" | "required";
};

export const zones: readonly ZoneDefinition[] = [
  {
    id: "shell",
    label: "Overview",
    shortLabel: "Home",
    description: "Platform home, global navigation and account.",
    path: "/",
    team: "Platform",
    app: "shell",
    port: 3001,
    framework: "next",
    nav: true,
    auth: "public",
  },
  {
    id: "catalog",
    label: "Service catalog",
    shortLabel: "Catalog",
    description: "Delivery services, SLAs and coverage.",
    path: "/catalog",
    team: "Catalog",
    app: "zone-catalog",
    port: 3002,
    assets: "/_assets/catalog",
    framework: "next",
    nav: true,
    auth: "public",
  },
  {
    id: "ops",
    label: "Operations",
    shortLabel: "Ops",
    description: "Routing rules, cutoffs and the audit trail.",
    path: "/ops",
    team: "Operations",
    app: "zone-ops",
    port: 3003,
    assets: "/_assets/ops",
    framework: "next",
    nav: true,
    auth: "required",
  },
  {
    id: "reports",
    label: "Reports",
    shortLabel: "Reports",
    description: "Volume, on-time performance and courier load.",
    path: "/reports",
    team: "Insights",
    app: "zone-reports",
    port: 3004,
    framework: "vite",
    nav: true,
    auth: "public",
  },
] as const;

export const SHELL_ZONE_ID = "shell";

/** Non-UI processes that live behind the same origin. */
export type ServiceDefinition = {
  id: string;
  app: string;
  port: number;
  path: string;
  framework: "node";
};

export const services: readonly ServiceDefinition[] = [
  { id: "mock-api", app: "mock-api", port: 4000, path: "/api", framework: "node" },
];

export function allApps(): ReadonlyArray<{
  id: string;
  app: string;
  port: number;
  framework: "next" | "vite" | "node";
}> {
  return [...zones, ...services];
}

export function zoneById(id: string): ZoneDefinition {
  const zone = zones.find((candidate) => candidate.id === id);
  if (!zone) {
    throw new Error(`Unknown zone "${id}". Add it to packages/routing/src/zones.ts.`);
  }
  return zone;
}

export function zoneByApp(app: string): ZoneDefinition {
  const zone = zones.find((candidate) => candidate.app === app);
  if (!zone) {
    throw new Error(`App "${app}" is not registered. Add it to packages/routing/src/zones.ts.`);
  }
  return zone;
}

/** The shell owns "/", which cannot be expressed as a basePath. */
export function zoneBasePath(zone: ZoneDefinition): string {
  return zone.path === "/" ? "" : zone.path;
}

/**
 * Longest-prefix, segment-safe match. `/ops` matches `/ops` and `/ops/x` but
 * not `/opsx`.
 */
export function matchZone(pathname: string): ZoneDefinition {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const candidates = zones
    .filter((zone) => zone.path !== "/")
    .sort((a, b) => b.path.length - a.path.length);

  for (const zone of candidates) {
    if (path === zone.path || path.startsWith(`${zone.path}/`)) {
      return zone;
    }
  }
  return zoneById(SHELL_ZONE_ID);
}

/** True when `href` leaves the current zone and therefore needs a real anchor. */
export function isCrossZone(href: string, currentZoneId: string): boolean {
  if (!href.startsWith("/")) return false;
  return matchZone(href).id !== currentZoneId;
}

/**
 * Convert a public path into the href a zone's own router expects. Next apps
 * configured with `basePath` take root-relative hrefs and add the prefix.
 */
export function toLocalHref(href: string, zone: ZoneDefinition): string {
  const base = zoneBasePath(zone);
  if (!base) return href;

  const splitAt = href.search(/[?#]/);
  const pathname = splitAt === -1 ? href : href.slice(0, splitAt);
  const suffix = splitAt === -1 ? "" : href.slice(splitAt);

  if (pathname === base) return `/${suffix}`;
  if (pathname.startsWith(`${base}/`)) return `${pathname.slice(base.length)}${suffix}`;
  return href;
}

/** Join a zone prefix with a local path. */
export function zoneHref(zone: ZoneDefinition, path = ""): string {
  const base = zoneBasePath(zone);
  if (!path || path === "/") return base || "/";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function navZones(): readonly ZoneDefinition[] {
  return zones.filter((zone) => zone.nav);
}

/** Public origin used for absolute links and local proxy checks. */
export function publicOrigin(): string {
  return process.env.PUBLIC_ORIGIN ?? "http://localhost:3000";
}

export function upstreamFor(zone: ZoneDefinition): string {
  return `http://localhost:${zone.port}`;
}
