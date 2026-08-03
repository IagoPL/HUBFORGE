import { NextResponse } from "next/server";

/**
 * Explicit demo entry: sets a cookie so /app can show the demo adapter
 * without fabricating a live workspace for anonymous production visitors.
 */
export function GET(request: Request) {
  const url = new URL("/app", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set("hf_demo", "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
