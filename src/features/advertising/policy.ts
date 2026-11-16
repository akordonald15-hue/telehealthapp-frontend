export const PUBLIC_ORIGIN = "https://www.caretekk.com";
const PUBLIC_SECTIONS = new Set(["", "#home", "#services", "#how-it-works", "#trust", "#faq", "#contact", "#doctors", "#home-care"]);

export function safePublicLocation(href: string, referrer: string): boolean {
  try {
    const url = new URL(href);
    if (url.origin !== PUBLIC_ORIGIN || url.pathname !== "/" || url.search || !PUBLIC_SECTIONS.has(url.hash) || url.username || url.password) return false;
    if (!referrer) return true;
    const previous = new URL(referrer);
    return previous.origin === PUBLIC_ORIGIN && previous.pathname === "/"
      && !previous.search && !previous.hash && !previous.username && !previous.password;
  } catch { return false; }
}

export function advertisingContextAllowed(requireVisible = true): boolean {
  try {
    if (!safePublicLocation(location.href, document.referrer) || (requireVisible && document.visibilityState !== "visible")) return false;
    const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (privacyNavigator.globalPrivacyControl || navigator.doNotTrack === "1") return false;
    if (document.cookie.split(";").some((v) => /^caretekk_session=/.test(v.trim()))) return false;
    if (sessionStorage.getItem("caretekk:auth-user") !== null) return false;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith("caretekk:founder50:v1:")) return false;
    }
    return true;
  } catch { return false; }
}
