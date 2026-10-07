import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

const email = "mfonasian@gmail.com";
const lifetimeSeconds = 60 * 60 * 8;

function secret() {
  return process.env.DASHBOARD_SESSION_SECRET ?? "";
}

export function verifyDashboardCredentials(candidateEmail: string, password: string) {
  const stored = process.env.DASHBOARD_PASSWORD_HASH ?? "";
  const [salt, expectedHex] = stored.split(":");
  if (!secret() || !salt || !expectedHex || candidateEmail.trim().toLowerCase() !== email) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length > 0 && timingSafeEqual(actual, expected);
}

export function createDashboardSession() {
  const expires = String(Math.floor(Date.now() / 1000) + lifetimeSeconds);
  const signature = createHmac("sha256", secret()).update(`${email}.${expires}`).digest("hex");
  return `${expires}.${signature}`;
}

export function isDashboardSession(value?: string) {
  if (!value || !secret()) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < Date.now() / 1000) return false;
  const expected = createHmac("sha256", secret()).update(`${email}.${expires}`).digest("hex");
  const provided = Buffer.from(signature, "hex");
  const valid = Buffer.from(expected, "hex");
  return provided.length === valid.length && timingSafeEqual(provided, valid);
}
