const PENDING_EMAIL_KEY = "caretekk.auth.pending_email";
const VERIFIED_EMAIL_KEY = "caretekk.auth.verified_email";

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage;
}

export function savePendingVerificationEmail(email: string) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  storage.setItem(PENDING_EMAIL_KEY, email.trim());
}

export function readPendingVerificationEmail() {
  const storage = getSessionStorage();
  return storage?.getItem(PENDING_EMAIL_KEY) ?? "";
}

export function clearPendingVerificationEmail() {
  const storage = getSessionStorage();
  storage?.removeItem(PENDING_EMAIL_KEY);
}

export function saveVerifiedRegistrationEmail(email: string) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  storage.setItem(VERIFIED_EMAIL_KEY, email.trim());
  storage.removeItem(PENDING_EMAIL_KEY);
}

export function readVerifiedRegistrationEmail() {
  const storage = getSessionStorage();
  return storage?.getItem(VERIFIED_EMAIL_KEY) ?? "";
}

export function clearVerifiedRegistrationEmail() {
  const storage = getSessionStorage();
  storage?.removeItem(VERIFIED_EMAIL_KEY);
}
