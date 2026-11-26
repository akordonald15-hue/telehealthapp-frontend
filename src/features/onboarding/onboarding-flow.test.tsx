import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";

const routerMock = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  profileUpdate: vi.fn(),
  me: vi.fn(),
  updateMe: vi.fn(),
}));

vi.mock("@/lib/api/endpoints", () => ({
  authApi: { me: mocks.me, updateMe: mocks.updateMe },
  profilesApi: { me: mocks.profile, updateMe: mocks.profileUpdate },
}));

import { OnboardingFlow } from "./onboarding-flow";

function renderFlow(props: Parameters<typeof OnboardingFlow>[0] = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OnboardingFlow {...props} />
    </QueryClientProvider>,
  );
}

async function completeStepOne(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "Full Name" }), "Ada Okafor");
  await user.click(screen.getByRole("combobox", { name: /Gender/ }));
  await user.click(screen.getByRole("option", { name: "Female" }));
  await user.click(screen.getByRole("combobox", { name: /Age Range/ }));
  await user.click(screen.getByRole("option", { name: "25-34" }));
}

async function goToStepTwo(user: ReturnType<typeof userEvent.setup>) {
  await completeStepOne(user);
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByRole("heading", { name: "Basic Information" });
}

async function selectState(user: ReturnType<typeof userEvent.setup>, state: string) {
  await user.click(screen.getByRole("combobox", { name: /State/ }));
  await user.click(screen.getByRole("option", { name: new RegExp(`^${state}$`) }));
}

async function selectLga(user: ReturnType<typeof userEvent.setup>, lga: string) {
  await user.click(screen.getByRole("combobox", { name: /Local Government/ }));
  await user.click(screen.getByRole("option", { name: new RegExp(`^${lga}$`) }));
}

async function completeStepTwo(user: ReturnType<typeof userEvent.setup>) {
  await selectState(user, "Akwa Ibom");
  await selectLga(user, "Eket");
}

beforeEach(() => {
  window.sessionStorage.clear();
  mocks.profile.mockResolvedValue({ profile_complete: false });
  mocks.me.mockResolvedValue({ id: 1, full_name: "", role: "patient" });
  mocks.updateMe.mockResolvedValue({});
  mocks.profileUpdate.mockResolvedValue({ profile_complete: true });
  routerMock.replace.mockClear();
  routerMock.push.mockClear();
});

afterEach(() => {
  document.cookie = "caretekk_session=; Path=/; Max-Age=0";
});

describe("OnboardingFlow", () => {
  it("starts on step 1 with Continue disabled and no Back control", async () => {
    const user = userEvent.setup();
    renderFlow();

    expect(screen.getByRole("heading", { name: "Welcome to Caretekk Onboarding" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Welcome to Caretekk Onboarding" })).toBeInTheDocument();
  });

  it("shows the full-name error on blur and keeps Continue disabled", async () => {
    const user = userEvent.setup();
    renderFlow();

    await user.type(screen.getByRole("textbox", { name: "Full Name" }), "David");
    await user.tab();

    expect(await screen.findByText("Enter your first and last name.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("enables Continue when step 1 is valid and advances to step 2", async () => {
    const user = userEvent.setup();
    renderFlow();

    await completeStepOne(user);
    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);
    expect(await screen.findByRole("heading", { name: "Basic Information" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Local Government/ })).toBeDisabled();
  });

  it("keeps step 1 values when navigating Back", async () => {
    const user = userEvent.setup();
    renderFlow();

    await goToStepTwo(user);
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("heading", { name: "Welcome to Caretekk Onboarding" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Full Name" })).toHaveValue("Ada Okafor");
    expect(screen.getByRole("combobox", { name: /Gender/ })).toHaveTextContent("Female");
  });

  it("enables LGA only after State and clears a stale LGA when State changes", async () => {
    const user = userEvent.setup();
    renderFlow();

    await goToStepTwo(user);
    const lgaCombobox = screen.getByRole("combobox", { name: /Local Government/ });
    expect(lgaCombobox).toBeDisabled();

    await selectState(user, "Akwa Ibom");
    expect(lgaCombobox).toBeEnabled();

    await selectLga(user, "Eket");
    expect(lgaCombobox).toHaveTextContent("Eket");
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();

    await selectState(user, "Lagos");
    expect(screen.getByRole("combobox", { name: /Local Government/ })).toHaveTextContent("Select local government");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("prefills the account name and the profile details", async () => {
    const user = userEvent.setup();
    document.cookie = "caretekk_session=1; Path=/";
    mocks.me.mockResolvedValue({ id: 1, full_name: "David Johnson", role: "patient" });
    mocks.profile.mockResolvedValue({
      profile_complete: false,
      full_name: "Profile Name",
      gender: "male",
      age_range: "35-44",
      state: "Lagos",
      lga: "Ikeja",
    });

    renderFlow();

    expect(await screen.findByDisplayValue("David Johnson")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Gender/ })).toHaveTextContent("Male");
    expect(screen.getByRole("combobox", { name: /Age Range/ })).toHaveTextContent("35-44");

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("combobox", { name: /State/ })).toHaveTextContent("Lagos");
    expect(screen.getByRole("combobox", { name: /Local Government/ })).toHaveTextContent("Ikeja");
  });

  it("saves the account name and profile fields, then redirects to the dashboard", async () => {
    const user = userEvent.setup();
    mocks.profile
      .mockResolvedValueOnce({ profile_complete: false })
      .mockResolvedValue({ profile_complete: true, gender: "female", age_range: "25-34", state: "Akwa Ibom", lga: "Eket" });
    mocks.profileUpdate.mockResolvedValue({
      profile_complete: true,
      gender: "female",
      age_range: "25-34",
      state: "Akwa Ibom",
      lga: "Eket",
    });

    renderFlow();
    await goToStepTwo(user);
    await completeStepTwo(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(mocks.updateMe).toHaveBeenCalledWith({ full_name: "Ada Okafor" }));
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      gender: "female",
      age_range: "25-34",
      state: "Akwa Ibom",
      lga: "Eket",
    });
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("maps server field errors back to the correct step and keeps the input", async () => {
    const user = userEvent.setup();
    mocks.profileUpdate.mockRejectedValue(new ApiError(400, { message: { state: ["Select a valid state."] } }));

    renderFlow();
    await goToStepTwo(user);
    await completeStepTwo(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Select a valid state.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Basic Information" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /State/ })).toHaveTextContent("Akwa Ibom");
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("shows an actionable message when the network is unreachable", async () => {
    const user = userEvent.setup();
    mocks.profileUpdate.mockRejectedValue(new TypeError("Failed to fetch"));

    renderFlow();
    await goToStepTwo(user);
    await completeStepTwo(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText(/couldn't reach Caretekk/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("shows an actionable message when the session has expired", async () => {
    const user = userEvent.setup();
    mocks.profileUpdate.mockRejectedValue(new ApiError(401, { detail: "Session expired." }));

    renderFlow();
    await goToStepTwo(user);
    await completeStepTwo(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Your session has expired. Please sign in again.")).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalledWith("/dashboard");
  });

  it("submits the collected values and shows a pending Continue button", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void = () => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    renderFlow({ onSubmit });

    await goToStepTwo(user);
    await completeStepTwo(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onSubmit).toHaveBeenCalledWith({
      full_name: "Ada Okafor",
      gender: "female",
      age_range: "25-34",
      state: "Akwa Ibom",
      lga: "Eket",
    });

    const savingButton = await screen.findByRole("button", { name: "Saving..." });
    expect(savingButton).toBeDisabled();
    expect(savingButton).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      resolveSubmit();
    });

    await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled());
  });

  it("redirects an already-complete patient to the dashboard (D11)", async () => {
    mocks.profile.mockResolvedValue({ profile_complete: true });
    renderFlow();

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByRole("heading", { name: "Welcome to Caretekk Onboarding" })).not.toBeInTheDocument();
  });
});
