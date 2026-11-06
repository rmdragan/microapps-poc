/**
 * Header names produced by the cluster edge (forward-auth / oauth2-proxy style).
 * Keeping them in one place means switching to a JWT or cookie adapter later is
 * a single-file change.
 */
export const AUTH_HEADERS = {
  user: "x-auth-request-user",
  email: "x-auth-request-email",
  groups: "x-auth-request-groups",
  preferredUsername: "x-auth-request-preferred-username",
} as const;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  groups: string[];
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function displayName(preferred: string | null, fallback: string): string {
  if (preferred) return preferred;
  return fallback
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * The edge is the only thing allowed to set these headers. The local proxy
 * strips inbound values before injecting its own, mirroring production.
 */
export function parseSession(headers: Headers): SessionUser | null {
  const id = headers.get(AUTH_HEADERS.user)?.trim();
  if (!id) return null;

  const email = headers.get(AUTH_HEADERS.email)?.trim() || `${id}@example.com`;
  const groups = (headers.get(AUTH_HEADERS.groups) ?? "")
    .split(",")
    .map((group) => group.trim())
    .filter(Boolean);

  return {
    id,
    name: displayName(headers.get(AUTH_HEADERS.preferredUsername), id),
    email,
    groups,
  };
}

/** Build the headers a zone forwards when it calls a downstream service. */
export function sessionHeaders(user: SessionUser): Record<string, string> {
  return {
    [AUTH_HEADERS.user]: user.id,
    [AUTH_HEADERS.email]: user.email,
    [AUTH_HEADERS.groups]: user.groups.join(","),
    [AUTH_HEADERS.preferredUsername]: user.name,
  };
}
