"use client";

import { useEffect, useRef, useState } from "react";

import { ErrorMessage } from "@/components/ui/error-message";
import { useGoogleLogin } from "@/lib/auth/use-auth";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
            },
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleAuthButton({ mode }: { mode: "login" | "signup" }) {
  const googleLogin = useGoogleLogin();
  const [localError, setLocalError] = useState(
    GOOGLE_CLIENT_ID ? "" : "Google sign-in is not set up yet for this environment.",
  );
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const initializeButton = () => {
      if (cancelled) {
        return;
      }

      const google = window.google?.accounts?.id;
      const container = buttonRef.current;
      if (!google || !container) {
        attempts += 1;
        if (attempts >= 20) {
          setLocalError("Google sign-in is still loading. Please refresh and try again.");
          return;
        }
        window.setTimeout(initializeButton, 250);
        return;
      }

      container.innerHTML = "";
      google.cancel();
      google.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (!response.credential) {
            setLocalError("Google sign-in did not return a valid account token.");
            return;
          }
          setLocalError("");
          googleLogin.mutate({ id_token: response.credential });
        },
      });
      google.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        logo_alignment: "left",
        text: mode === "login" ? "signin_with" : "signup_with",
        width: Math.max(220, Math.min(container.clientWidth || 360, 360)),
      });
    };

    initializeButton();

    return () => {
      cancelled = true;
    };
  }, [googleLogin, mode]);

  return (
    <div className="grid gap-3">
      <div
        className="flex min-h-12 justify-center overflow-hidden rounded-[12px] border border-slate-200 bg-white px-1 py-1"
        aria-live="polite"
      >
        <div ref={buttonRef} className="w-full max-w-full" />
      </div>
      {googleLogin.isPending ? <p className="text-sm text-slate-500">Connecting to Google...</p> : null}
      {googleLogin.error ? <ErrorMessage error={googleLogin.error} context="auth" /> : null}
      {localError ? <p className="text-sm text-amber-700">{localError}</p> : null}
    </div>
  );
}
