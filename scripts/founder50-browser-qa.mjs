// Local-only browser QA. Start Next with NEXT_PUBLIC_FOUNDER50_ENABLED=true.
// Every API request is intercepted; this cannot create production transactions.
import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3104";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Loopback QA only");
const output = process.env.QA_OUTPUT_DIR || "artifacts/founder50-qa";
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const localFixture = process.env.QA_LOCAL_BACKEND_FIXTURE
  ? JSON.parse(fs.readFileSync(process.env.QA_LOCAL_BACKEND_FIXTURE, "utf8"))
  : null;
const empty = { count: 0, next: null, previous: null, results: [] };
const doctor = {
  id: 42,
  display_name: "Dr Ada",
  user: 42,
  specialties: [],
  bio: "General physician",
  availability_status: "available",
  preferred_availability_status: "available",
  rating: 4.9,
  review_count: 5,
  active_workload: 0,
  profile_image_url: null,
  unavailable_consultation_slots: [],
};
const results = [];
async function journey(viewport, mode) {
  const context = await browser.newContext({ viewport });
  await context.addCookies([
    { name: "caretekk_session", value: "1", url: base },
  ]);
  if (localFixture)
    await context.addCookies([
      {
        name: "caretekk_access",
        value: localFixture.access,
        url: base,
        httpOnly: true,
      },
    ]);
  const page = await context.newPage();
  let promoRequests = 0;
  let claim = null,
    booked = null,
    attempts = [],
    applyCount = 0;
  const expires = new Date(Date.now() + 86400000).toISOString();
  const pricing = {
    service_value: "2000.00",
    discount: "2000.00",
    amount_due: "0.00",
    currency: "NGN",
    promotion_applied: true,
    reward_applied: false,
    promotion_code: "FOUNDER50",
  };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes("/promotions/")) promoRequests++;
    if (
      mode === "real" &&
      (path.includes("/promotions/") || path.endsWith("/appointments/book/"))
    ) {
      if (path.endsWith("/appointments/book/"))
        attempts.push(route.request().postDataJSON());
      if (path.endsWith("/reserve/")) applyCount++;
      return route.continue();
    }
    let json = empty,
      status = 200;
    if (path.includes("/auth/me"))
      json = {
        id: localFixture?.user || 901,
        role: "patient",
        email: "qa@example.test",
        full_name: "QA Patient",
        is_email_verified: true,
      };
    else if (path.includes("/profiles/me"))
      json = { id: 901, profile_complete: true, full_name: "QA Patient" };
    else if (path.includes("/available-doctors"))
      json = {
        ...empty,
        count: 1,
        results: [{ ...doctor, id: localFixture?.doctor || doctor.id }],
      };
    else if (path.endsWith("/promotions/founder50/"))
      json = {
        accepting_reservations: true,
        eligible: !claim,
        can_reserve: !claim,
        remaining_capacity: claim ? 49 : 50,
        claim,
        code: claim ? "benefit_already_claimed" : "available",
      };
    else if (path.endsWith("/reserve/")) {
      applyCount++;
      if (mode === "exhausted") {
        status = 409;
        json = {
          code: "capacity_exhausted",
          detail: "All entitlements occupied",
        };
      } else {
        claim = {
          public_id: "00000000-0000-4000-8000-000000000001",
          status: "reserved",
          reserved_at: new Date().toISOString(),
          expires_at: expires,
        };
        status = 201;
        json = { reservation: claim, pricing, applied: true, replayed: false };
      }
    } else if (path.includes("/promotions/reservations/"))
      json = {
        reservation: claim,
        pricing: claim?.status === "reserved" ? pricing : null,
      };
    else if (path.endsWith("/appointments/book/")) {
      const body = route.request().postDataJSON();
      attempts.push(body);
      if (mode === "paid" || mode === "disabled") {
        expect(body).not.toHaveProperty("promotion_reservation_id");
        expect(body).not.toHaveProperty("idempotency_key");
        json = {
          appointment: { id: 456, status: "pending_payment" },
          payment: {
            provider: "paystack",
            status: "pending",
            amount: "2000.00",
            authorization_url: `${base}/synthetic-checkout`,
            initialization_status: "ready",
          },
        };
        status = 201;
      } else {
        claim = { ...claim, status: "booked" };
        booked = {
          id: 456,
          patient: 901,
          doctor: 42,
          doctor_profile: { id: 42, display_name: "Dr Ada" },
          scheduled_at: body.scheduled_at,
          status: "confirmed",
          reason: body.reason,
          notes: "",
          triage_session: 5,
          created_at: new Date().toISOString(),
        };
        if (mode === "lost" && attempts.length === 1)
          return route.abort("failed");
        status = attempts.length === 1 ? 201 : 200;
        json = {
          appointment: booked,
          payment: {
            payment_id: 789,
            provider: "promotional",
            amount: "0.00",
            currency: "NGN",
            status: "success",
            authorization_url: "",
            pricing,
          },
          checkout_type: "promotional",
          checkout_action: "confirmed",
          payment_required: false,
          booking_status: "confirmed",
          amount_due: "0.00",
          currency: "NGN",
          reservation: claim,
        };
      }
    } else if (path.endsWith("/appointments/"))
      json = {
        ...empty,
        count: booked ? 1 : 0,
        results: booked ? [booked] : [],
      };
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(json),
    });
  });
  await page.goto(
    `${base}/appointments?triage_session=${localFixture?.triage || 5}`,
    { waitUntil: "domcontentloaded" },
  );
  const dismiss = page.getByRole("button", { name: "Not now", exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
  await page
    .getByRole("button", { name: "View recommended doctors", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Select Doctor", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Confirm doctor and time" });
  await dialog.getByRole("button", { name: /Schedule for later/ }).click();
  await dialog.getByRole("button", { name: "Tomorrow", exact: true }).click();
  await dialog.getByRole("button", { name: "8:00 AM", exact: true }).click();
  const panel = dialog.getByRole("region", {
    name: "Promotional consultation",
  });
  if (mode !== "paid" && mode !== "disabled") {
    const input = panel.getByLabel("Promo code");
    await input.focus();
    await page.keyboard.type("FOUNDER50");
    await page.keyboard.press("Enter");
    expect(applyCount).toBeLessThanOrEqual(1);
    if (mode === "exhausted") {
      await expect(panel.getByRole("alert")).toContainText("All 50");
      expect(attempts).toHaveLength(0);
    } else {
      await expect(panel.getByText("Total to pay")).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Book Free Consultation" }).first(),
      ).toBeEnabled();
      const overflow = await panel.evaluate(
        (el) => el.scrollWidth > el.clientWidth + 1,
      );
      expect(overflow).toBe(false);
      await panel.screenshot({
        path: `${output}/${viewport.width}-${mode}.png`,
      });
      await dialog
        .getByRole("button", { name: "Book Free Consultation" })
        .first()
        .click();
      if (mode === "lost") {
        await expect(
          dialog.getByRole("button", { name: "Recover booking result" }),
        ).toBeVisible();
        await page.reload({ waitUntil: "domcontentloaded" });
        await page
          .getByRole("button", { name: "Recover booking result" })
          .first()
          .click();
        await expect.poll(() => attempts.length).toBe(2);
        expect(attempts[1]).toEqual(attempts[0]);
      }
      await expect(
        page.getByText("Your free consultation is confirmed.", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Open appointment details" }),
      ).toHaveAttribute(
        "href",
        mode === "real" ? /\/appointments\/\d+$/ : "/appointments/456",
      );
      expect(attempts[0].reason).toBe("AI-assisted doctor consultation");
      expect(attempts[0].notes).toBe("");
    }
  } else {
    if (mode === "disabled") await expect(panel).toHaveCount(0);
    await page.route("**/synthetic-checkout", (route) =>
      route.fulfill({ body: "Synthetic Paystack checkout" }),
    );
    await dialog
      .getByRole("button", { name: "Make Payment", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/synthetic-checkout/);
    expect(applyCount).toBe(0);
    if (mode === "disabled") expect(promoRequests).toBe(0);
  }
  results.push({
    viewport,
    mode,
    applyCount,
    bookingRequests: attempts.length,
    passed: true,
  });
  await context.close();
}
try {
  if (localFixture) await journey({ width: 390, height: 844 }, "real");
  else if (process.env.QA_DISABLED === "true") {
    await journey({ width: 390, height: 844 }, "disabled");
  } else {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 1000 },
    ])
      await journey(viewport, "free");
    await journey({ width: 390, height: 844 }, "lost");
    await journey({ width: 390, height: 844 }, "exhausted");
    await journey({ width: 1440, height: 1000 }, "paid");
  }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
