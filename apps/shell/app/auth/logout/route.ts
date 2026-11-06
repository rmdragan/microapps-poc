import { NextResponse } from "next/server";

export function GET() {
  const publicOrigin = process.env.NEXT_PUBLIC_PUBLIC_ORIGIN ?? "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/", publicOrigin));
  response.cookies.set("dev-session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
