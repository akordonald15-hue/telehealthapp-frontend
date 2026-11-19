import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const google = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
  return {
    mutate: vi.fn(),
    state: { isPending: false, isSuccess: false, error: null as unknown },
    callback: undefined as undefined | ((response: { credential?: string }) => void),
  };
});

vi.mock("@/lib/auth/use-auth", () => ({
  useGoogleLogin: () => ({ ...google.state, mutate: google.mutate }),
}));

import { GoogleAuthButton } from "./google-auth-button";

const renderButton = vi.fn((parent: HTMLElement) => {
  const button = document.createElement("div");
  button.textContent = "Sign in with Google";
  parent.appendChild(button);
});

function setState(next: Partial<typeof google.state>) {
  google.state = { isPending: false, isSuccess: false, error: null, ...next };
}

describe("GoogleAuthButton (plain)", () => {
  beforeEach(() => {
    setState({});
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn((options) => {
            google.callback = options.callback;
          }),
          renderButton,
          cancel: vi.fn(),
        },
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete window.google;
  });

  it("passes the Google credential to the login mutation", () => {
    render(<GoogleAuthButton mode="login" variant="plain" />);

    google.callback?.({ credential: "google-id-token" });

    expect(google.mutate).toHaveBeenCalledWith({ id_token: "google-id-token" });
  });

  it("swaps the Google button for a spinner while signing in, then falls back on error", () => {
    const { rerender } = render(<GoogleAuthButton mode="login" variant="plain" />);
    const googleButtonSlot = screen.getByText("Sign in with Google").parentElement!;
    expect(googleButtonSlot).not.toHaveClass("invisible");
    expect(screen.getByRole("status")).toHaveTextContent("");

    setState({ isPending: true });
    rerender(<GoogleAuthButton mode="login" variant="plain" />);
    expect(googleButtonSlot).toHaveClass("invisible");
    expect(screen.getByRole("status")).toHaveTextContent("Signing in with Google...");

    setState({ error: new Error("Google sign-in could not be verified") });
    rerender(<GoogleAuthButton mode="login" variant="plain" />);
    expect(googleButtonSlot).not.toHaveClass("invisible");
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't verify your Google account/i);
    expect(renderButton).toHaveBeenCalledTimes(1);
  });

  it("keeps the spinner after success while the app redirects", () => {
    const { rerender } = render(<GoogleAuthButton mode="login" variant="plain" />);

    setState({ isSuccess: true });
    rerender(<GoogleAuthButton mode="login" variant="plain" />);

    expect(screen.getByText("Sign in with Google").parentElement).toHaveClass("invisible");
    expect(screen.getByRole("status")).toHaveTextContent("Signing in with Google...");
  });
});
