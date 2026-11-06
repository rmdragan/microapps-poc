import { getSession } from "@micro/auth/server";
import { redirect } from "next/navigation";

const origin = process.env.NEXT_PUBLIC_PUBLIC_ORIGIN ?? "http://localhost:3000";

/**
 * The ops zone is the only one that requires a session. In production the edge
 * would usually reject anonymous requests first; the zone still checks, because
 * defense in depth is cheaper than trusting the layer above.
 */
export async function requireOpsSession() {
  const user = await getSession();
  if (!user) {
    redirect(`${origin}/auth/login?returnTo=${encodeURIComponent("/ops")}`);
  }
  return user;
}
