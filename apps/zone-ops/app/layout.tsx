import type { Metadata } from "next";
import { zoneBasePath, zoneById } from "@micro/routing";
import { AppShell, Providers } from "@micro/ui";
import { ZoneLink } from "@micro/ui/next";
import { requireOpsSession } from "../lib/require-session";
import "./globals.css";

const zone = zoneById("ops");

export const metadata: Metadata = {
  title: {
    default: "Operations · Relay",
    template: "%s · Relay",
  },
  description: zone.description,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOpsSession();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers user={user} zone={{ id: zone.id, basePath: zoneBasePath(zone) }}>
          <AppShell
            zone={{ id: zone.id }}
            build={{
              app: zone.app,
              version: process.env.BUILD_INFO ?? "dev",
              mode: process.env.NODE_ENV ?? "development",
            }}
            linkComponent={ZoneLink}
          >
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
