import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/dasbooard/login", request.url), 303);
  response.cookies.set("caretekk_dashboard_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/dasbooard", maxAge: 0 });
  return response;
}
