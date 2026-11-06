import { headers } from "next/headers";
import { parseSession, type SessionUser } from "./headers";

const MOCK_USER: SessionUser = {
  id: "robin.vale",
  name: "Robin Vale",
  email: "robin.vale@example.com",
  groups: ["platform", "ops"],
};

/**
 * Server-only session access for Next zones. The edge injects forward-auth
 * headers; a zone only reads them. `AUTH_MODE=mock` exists so a zone can be
 * opened directly on its port during development.
 */
export async function getSession(): Promise<SessionUser | null> {
  if (process.env.AUTH_MODE === "mock") return MOCK_USER;
  return parseSession(await headers());
}
