"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "./headers";

type SessionState = { user: SessionUser | null | undefined };

const SessionContext = createContext<SessionState>({ user: null });

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser | null | undefined;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={{ user }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}
