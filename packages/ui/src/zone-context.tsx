"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ZoneInfo } from "./types";

const ZoneContext = createContext<ZoneInfo>({ id: "shell", basePath: "" });

export function ZoneProvider({ zone, children }: { zone: ZoneInfo; children: ReactNode }) {
  return <ZoneContext.Provider value={zone}>{children}</ZoneContext.Provider>;
}

export function useZone(): ZoneInfo {
  return useContext(ZoneContext);
}
