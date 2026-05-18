import type { TokenPair } from "@/lib/types/backend";

const SESSION_COOKIE_NAME = "caretekk_session";

function canUseCookies() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getAccessToken() {
  return null;
}

export function getRefreshToken() {
  return null;
}

export function setTokens(_tokens: TokenPair) {
  if (!canUseCookies()) {
    return;
  }
  void _tokens;
  document.cookie = `${SESSION_COOKIE_NAME}=1; Path=/; SameSite=Lax`;
}

export function updateAccessToken(access: string) {
  void access;
}

export function clearTokens() {
  if (!canUseCookies()) {
    return;
  }
  document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function hasStoredSession() {
  if (!canUseCookies()) {
    return false;
  }
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === `${SESSION_COOKIE_NAME}=1`);
}
