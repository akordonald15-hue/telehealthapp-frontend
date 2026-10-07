import { NextRequest, NextResponse } from "next/server";
import { createDashboardSession, verifyDashboardCredentials } from "@/lib/server/dashboard-access";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!verifyDashboardCredentials(email, password)) {
    return NextResponse.redirect(new URL("/dasbooard/login?error=1", request.url), 303);
  }
  const response = NextResponse.redirect(new URL("/dasbooard", request.url), 303);
  response.cookies.set("caretekk_dashboard_session", createDashboardSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/dasbooard", maxAge: 60 * 60 * 8 });
  return response;
}
