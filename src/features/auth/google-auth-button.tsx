"use client";

import { useEffect, useRef, useState } from "react";

import { ErrorMessage } from "@/components/ui/error-message";
import { useGoogleLogin } from "@/lib/auth/use-auth";
import { cn } from "@/lib/utils";

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

// Google brand mark. These brand colours are intentionally hardcoded: the
// Google Identity Guidelines require the official logo colours.
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

// Static design button shown when Google Identity Services cannot run (no
// client ID, or the script was blocked/failed to load). It keeps the designed
// surface instead of leaving an empty container plus a warning line.
function GoogleUnavailableButton({ mode }: { mode: "login" | "signup" }) {
  const label = mode === "login" ? "Sign in with Google" : "Sign up with Google";

  return (
    <button
      type="button"
      disabled
      aria-label={`${label} (unavailable in this environment)`}
      title="Google sign-in is not available in this environment."
      className="flex min-h-14 w-full items-center justify-center gap-[10px] rounded-[18px] border border-grey-100 bg-white px-6 font-inter-tight text-base font-medium leading-5 text-black-500 shadow-[inset_0_0_0_6px_var(--color-grey-50)] disabled:cursor-not-allowed disabled:opacity-100"
    >
      <GoogleMark className="size-[18px] shrink-0" />
      <span>{label}</span>
    </button>
  );
}

export function GoogleAuthButton({
  mode,
  containerClassName,
}: {
  mode: "login" | "signup";
  containerClassName?: string;
}) {
  const googleLogin = useGoogleLogin();
  const [localError, setLocalError] = useState("");
  const [scriptFailed, setScriptFailed] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const unavailable = !GOOGLE_CLIENT_ID || scriptFailed;

  useEffect(() => {
    if (unavailable) {
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
          setScriptFailed(true);
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
  }, [googleLogin, mode, unavailable]);

  if (unavailable) {
    return <GoogleUnavailableButton mode={mode} />;
  }

  return (
    <div className="grid gap-3">
      <div
        className={cn(
          "flex justify-center overflow-hidden",
          containerClassName ?? "min-h-12 rounded-[12px] border border-ash-200 bg-surface px-1 py-1",
        )}
        aria-live="polite"
      >
        <div ref={buttonRef} className="w-full max-w-full" />
      </div>
      {googleLogin.isPending ? <p className="text-sm text-ash-500">Connecting to Google...</p> : null}
      {googleLogin.error ? <ErrorMessage error={googleLogin.error} context="auth" /> : null}
      {localError ? <p className="text-sm text-warning">{localError}</p> : null}
    </div>
  );
}
