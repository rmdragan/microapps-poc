import { NextResponse, type NextRequest } from "next/server";

/**
 * Cross-zone redirects must be HTTP redirects. A Server Action redirect stays
 * inside the current Next app, so the shell would try to render /ops itself and
 * 404. A plain form POST gives the browser a real 303.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } catch {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const form = await request.formData();
  const requested = String(form.get("returnTo") ?? "/");
  const returnTo =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  const publicOrigin = process.env.NEXT_PUBLIC_PUBLIC_ORIGIN ?? "http://localhost:3000";
  const response = NextResponse.redirect(new URL(returnTo, publicOrigin), 303);
  response.cookies.set("dev-session", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
