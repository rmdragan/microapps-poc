import { AUTH_HEADERS } from "@micro/auth/headers";
import { createApiClient } from "./client";

/**
 * Server-side client for Next zones. It forwards the edge's identity headers,
 * which is how a zone authenticates downstream without ever seeing the SSO
 * cookie. In production the base URL points at an internal API gateway.
 */
export function createServerApi(incoming: Headers) {
  const baseUrl = process.env.API_URL ?? "http://localhost:4000";
  const forwarded = new Headers();

  for (const name of Object.values(AUTH_HEADERS)) {
    const value = incoming.get(name);
    if (value) forwarded.set(name, value);
  }

  return createApiClient({ baseUrl, headers: forwarded });
}
