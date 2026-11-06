"use client";

import { SessionProvider, type SessionUser } from "@micro/auth";
import type { ReactNode } from "react";
import type { ZoneInfo } from "./types";
import { ZoneProvider } from "./zone-context";

/**
 * Every zone mounts this at its root. The React tree is recreated on a
 * cross-zone navigation, so shared providers ship as a package rather than
 * living in one long-lived shell.
 */
export function Providers({
  user,
  zone,
  children,
}: {
  user: SessionUser | null | undefined;
  zone: ZoneInfo;
  children: ReactNode;
}) {
  return (
    <SessionProvider user={user}>
      <ZoneProvider zone={zone}>{children}</ZoneProvider>
    </SessionProvider>
  );
}
