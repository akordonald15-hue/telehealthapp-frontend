import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";

it("preserves application URLs and keeps only the homepage in the marketing document", () => {
  const pages = readdirSync("src/app/(site)", { recursive: true }).map(String).map((p) => p.replaceAll("\\", "/"));
  const urls = pages.filter((p) => p.endsWith("/page.tsx")).map((p) => "/" + p.replace(/\/page\.tsx$/, "").split("/").filter((s) => !s.startsWith("(")).join("/"));
  expect(urls).toEqual(expect.arrayContaining([
    "/appointments", "/appointments/[id]", "/dashboard", "/messages", "/payments", "/records", "/profile", "/refer", "/referrals", "/triage", "/care-plan", "/audit",
    "/home-care/book", "/home-care/requests", "/home-care/requests/[id]", "/nurse/history", "/nurse/requests", "/nurse/request/[id]",
    "/login", "/register", "/change-password", "/password-reset", "/provider-setup", "/verify-email", "/onboarding", "/offline", "/r/[code]", "/dasbooard", "/dasbooard/login",
  ]));
  expect(readdirSync("src/app/(marketing)", { recursive: true }).map(String).filter((p) => p.endsWith("page.tsx"))).toEqual(["page.tsx"]);
});

it("keeps the SDK boundary outside the application root and preserves document providers", () => {
  const app = readFileSync("src/app/(site)/layout.tsx", "utf8");
  const doc = readFileSync("src/app/document.tsx", "utf8");
  expect(app).not.toMatch(/advertising-boundary|next\/script|facebook/);
  expect(app).toContain("<DocumentShell>");
  expect(doc).toContain("<Providers>{children}</Providers>");
  expect(doc).toContain("export const metadata"); expect(doc).toContain("export const viewport");
});
