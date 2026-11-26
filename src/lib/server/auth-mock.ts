import type { NextRequest } from "next/server";

// Dev-only synthetic responses for the sign-up flow. Enabled by NEXT_PUBLIC_AUTH_MOCK=1
// (see .env.development.local). Never active in production builds, and never used when the
// flag is absent, so real backend proxying is unchanged.
export function isAuthMockEnabled() {
  const flag = process.env.NEXT_PUBLIC_AUTH_MOCK;
  return (
    process.env.NODE_ENV !== "production" &&
    (flag === "1" || flag?.toLowerCase() === "true")
  );
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function mockOtpRequest(request: NextRequest) {
  const body = await readJson(request);
  console.info("[auth-mock] POST /auth/otp/request/", { email: body.email });
  return json({ detail: "Dev mock: verification code sent. Enter any 6 digits." });
}

export async function mockOtpVerify(request: NextRequest) {
  const body = await readJson(request);
  const code = typeof body.code === "string" ? body.code : "";
  console.info("[auth-mock] POST /auth/otp/verify/", { email: body.email, code });

  if (!/^\d{6}$/.test(code)) {
    return json({ detail: "Enter the 6-digit code from your email." }, 400);
  }

  return json({ detail: "Dev mock: email verified." });
}

export async function mockRegister(request: NextRequest) {
  const body = await readJson(request);
  const email = typeof body.email === "string" ? body.email : "new-patient@example.test";
  const phone = typeof body.phone === "string" ? body.phone : "";
  const referralCode = typeof body.referral_code === "string" ? body.referral_code : "";
  console.info("[auth-mock] POST /auth/register/", { email, phone, referralCode });

  return json({
    id: 1,
    email,
    phone,
    role: "patient",
    ...(referralCode ? { referral: { applied: true, detail: "Dev mock: referral applied." } } : {}),
  });
}
