"use client";

import { Chrome } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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
          prompt: (callback?: (notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleAuthButton({ mode }: { mode: "login" | "signup" }) {
  const googleLogin = useGoogleLogin();
  const [localError, setLocalError] = useState("");
  const label = "Continue with Google";

  function handleGoogleClick() {
    setLocalError("");

    if (!GOOGLE_CLIENT_ID) {
      setLocalError("Google sign-in is not set up yet for this environment.");
      return;
    }

    const google = window.google?.accounts?.id;
    if (!google) {
      setLocalError("Google sign-in is still loading. Please try again.");
      return;
    }

    google.cancel();
    google.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (!response.credential) {
          setLocalError("Google sign-in did not return a valid account token.");
          return;
        }
        googleLogin.mutate({ id_token: response.credential });
      },
    });
    google.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        setLocalError("Google sign-in is unavailable right now. Please continue with email.");
      }
    });
  }

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        variant="secondary"
        className="min-h-12 border-slate-200 bg-white text-[#1F2937] hover:bg-slate-50"
        onClick={handleGoogleClick}
        disabled={googleLogin.isPending}
        aria-label={mode === "login" ? "Continue with Google" : "Create account with Google"}
      >
        <Chrome className="mr-2 h-4 w-4" />
        {googleLogin.isPending ? "Connecting..." : label}
      </Button>
      {googleLogin.error ? <ErrorMessage error={googleLogin.error} context="auth" /> : null}
      {localError ? <p className="text-sm text-amber-700">{localError}</p> : null}
    </div>
  );
}
