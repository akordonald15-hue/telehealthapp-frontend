import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import type { Appointment, ProviderReview } from "@/lib/types/backend";

const mocks = vi.hoisted(() => ({ submitRating: vi.fn() }));

vi.mock("@/lib/api/endpoints", () => ({ appointmentsApi: mocks }));

import { canRateAppointment, ConsultationReviewForm, ConsultationReviewSummary, DoctorPublicReviews } from "./consultation-review";

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 41,
    patient: 1,
    doctor: 2,
    scheduled_at: "2026-10-27T09:00:00Z",
    status: "completed",
    reason: "",
    notes: "",
    rating: null,
    ...overrides,
  };
}

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { invalidate };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("canRateAppointment", () => {
  it("allows only completed consultations without a rating", () => {
    expect(canRateAppointment(appointment())).toBe(true);
    expect(canRateAppointment(appointment({ status: "scheduled" }))).toBe(false);
    expect(canRateAppointment(appointment({ status: "cancelled" }))).toBe(false);
    expect(
      canRateAppointment(appointment({ rating: { id: 1, score: 4, feedback: "", created_at: "2026-10-27T10:00:00Z" } })),
    ).toBe(false);
  });
});

describe("ConsultationReviewForm", () => {
  it("tells the patient their comment may be shown anonymously", () => {
    renderWithClient(<ConsultationReviewForm appointmentId={41} />);
    expect(screen.getByText(/Your name is never shown/)).toBeInTheDocument();
  });

  it("submits the selected score with a trimmed comment and refreshes appointments", async () => {
    mocks.submitRating.mockResolvedValue({ id: 9, score: 4, feedback: "Clear advice", created_at: "2026-10-27T10:00:00Z" });
    const onSubmitted = vi.fn();
    const { invalidate } = renderWithClient(<ConsultationReviewForm appointmentId={41} onSubmitted={onSubmitted} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("radio", { name: "4 stars" }));
    await user.type(screen.getByRole("textbox"), "  Clear advice  ");
    await user.click(screen.getByRole("button", { name: "Submit review" }));

    await waitFor(() => expect(screen.getByText("Review submitted")).toBeInTheDocument());
    expect(mocks.submitRating).toHaveBeenCalledWith(41, { score: 4, feedback: "Clear advice", public_comment: true });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["appointments"] });
  });

  it("shows the server's refusal and keeps the comment for retry", async () => {
    mocks.submitRating.mockRejectedValue(
      new ApiError(400, {
        detail: "Ratings are paused while this consultation is under review.",
      }),
    );
    const onSubmitted = vi.fn();
    renderWithClient(<ConsultationReviewForm appointmentId={41} onSubmitted={onSubmitted} />);
    const user = userEvent.setup();

    await user.type(screen.getByRole("textbox"), "Good visit");
    await user.click(screen.getByRole("button", { name: "Submit review" }));

    await waitFor(() => expect(mocks.submitRating).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText("Review submitted")).not.toBeInTheDocument());
    expect(screen.getByRole("textbox")).toHaveValue("Good visit");
    expect(onSubmitted).not.toHaveBeenCalled();
  });
});

describe("ConsultationReviewSummary", () => {
  it("shows the patient's own score and comment", () => {
    render(<ConsultationReviewSummary rating={{ id: 3, score: 5, feedback: "Very patient", created_at: "2026-10-27T10:00:00Z" }} />);
    expect(screen.getByLabelText("5 star rating")).toBeInTheDocument();
    expect(screen.getByText(/Very patient/)).toBeInTheDocument();
  });
});

describe("ConsultationReviewSummary visibility", () => {
  it.each([
    ["published", /Visible to other patients as .Verified patient./],
    ["private", /Only visible to you and Caretekk/],
    ["hidden", /Hidden from other patients by Caretekk/],
  ] as const)("explains a %s comment", (commentStatus, text) => {
    render(
      <ConsultationReviewSummary
        rating={{ id: 3, score: 4, feedback: "Helpful", comment_status: commentStatus, created_at: "2026-10-27T10:00:00Z" }}
      />,
    );
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("omits the note when the backend does not report visibility", () => {
    render(<ConsultationReviewSummary rating={{ id: 3, score: 4, feedback: "Helpful", created_at: "2026-10-27T10:00:00Z" }} />);
    expect(screen.queryByText(/other patients|Only visible/)).not.toBeInTheDocument();
  });
});

describe("DoctorPublicReviews", () => {
  const review = (id: number, comment: string): ProviderReview => ({ id, score: 5, comment, created_at: "2026-10-27T10:00:00Z" });

  it("shows up to three comments attributed only to a verified patient", () => {
    render(<DoctorPublicReviews reviews={[review(1, "One"), review(2, "Two"), review(3, "Three"), review(4, "Four")]} />);
    expect(screen.getAllByText("Verified patient")).toHaveLength(3);
    expect(screen.queryByText(/Four/)).not.toBeInTheDocument();
  });

  it("ignores reviews from an API that still identifies reviewers", () => {
    const legacy = { ...review(1, "Written privately"), patient_name: "Adaeze Okafor" } as ProviderReview;
    const { container } = render(<DoctorPublicReviews reviews={[legacy]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing without reviews", () => {
    const { container } = render(<DoctorPublicReviews reviews={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
