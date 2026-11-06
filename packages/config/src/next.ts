import type { NextConfig } from "next";
import { zoneByApp } from "@micro/routing";

/**
 * Packages consumed as TypeScript source. Keeping them unbuilt keeps the
 * monorepo simple: Next compiles them, Vite compiles them, and there is no
 * stale dist folder to explain.
 */
export const SHARED_PACKAGES = [
  "@micro/ui",
  "@micro/auth",
  "@micro/api",
  "@micro/routing",
] as const;

/**
 * Every Next zone configures itself through this factory so that the prefix,
 * asset namespace and Server Action origin rules cannot drift from the route
 * registry.
 */
export function createNextConfig(app: string): NextConfig {
  const zone = zoneByApp(app);
  const basePath = zone.path === "/" ? undefined : zone.path;
  const publicOrigin = process.env.PUBLIC_ORIGIN ?? "http://localhost:3000";
  const publicHost = new URL(publicOrigin).host;

  return {
    basePath,
    assetPrefix: zone.assets,
    env: {
      NEXT_PUBLIC_ZONE_ID: zone.id,
      NEXT_PUBLIC_PUBLIC_ORIGIN: publicOrigin,
    },
    images: {
      qualities: [75],
    },
    experimental: {
      serverActions: {
        allowedOrigins: [publicHost, "localhost:3000"],
      },
    },
    transpilePackages: [...SHARED_PACKAGES],
    agentRules: false,
    devIndicators: false,
  };
}
