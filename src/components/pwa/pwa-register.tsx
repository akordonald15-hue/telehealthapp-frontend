"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let didRefresh = false;

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
        await registration.update();

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (didRefresh) {
            return;
          }

          didRefresh = true;
          window.location.reload();
        });
      } catch (error) {
        console.warn("Caretekk service worker registration failed.", error);
      }
    };

    void registerWorker();
  }, []);

  return null;
}
