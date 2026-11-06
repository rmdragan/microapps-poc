import type { Metadata } from "next";
import { zoneBasePath, zoneById } from "@micro/routing";
import { getSession } from "@micro/auth/server";
import { AppShell, Providers } from "@micro/ui";
import { ZoneLink } from "@micro/ui/next";
import "./globals.css";

const zone = zoneById("shell");

export const metadata: Metadata = {
  title: {
    default: "Relay · delivery platform",
    template: "%s · Relay",
  },
  description:
    "One delivery platform built from independently deployed Next.js and Vite zones.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers
          user={user}
          zone={{ id: zone.id, basePath: zoneBasePath(zone) }}
        >
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
