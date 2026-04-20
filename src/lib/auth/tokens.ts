import type { TokenPair } from "@/lib/types/backend";

const ACCESS_TOKEN_KEY = "telehealth.access";
const REFRESH_TOKEN_KEY = "telehealth.refresh";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken() {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: TokenPair) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  if (tokens.refresh) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
}

export function updateAccessToken(access: string) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
}

export function clearTokens() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasStoredSession() {
  return Boolean(getAccessToken());
}
