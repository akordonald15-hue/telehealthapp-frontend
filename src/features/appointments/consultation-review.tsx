"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { appointmentsApi } from "@/lib/api/endpoints";
import type { Appointment, AppointmentRating } from "@/lib/types/backend";
import { cn } from "@/lib/utils";

// Mirrors the backend rule: only the patient's own completed, not-yet-rated consultation.
// Submission stays server-validated (ownership, completion, disputes, one rating per visit).
export function canRateAppointment(appointment: Appointment) {
  return appointment.status === "completed" && !appointment.rating;
}

export function ConsultationReviewSummary({ rating, className }: { rating: AppointmentRating; className?: string }) {
  return (
    <div className={cn("rounded-[8px] border border-[#DBEAFE] bg-[#F8FBFF] p-4", className)}>
      <p className="text-sm font-semibold text-[#1F2937]">Your review</p>
      <div className="mt-2 flex items-center gap-1 text-[#2563EB]" aria-label={`${rating.score} star rating`}>
        {[1, 2, 3, 4, 5].map((item) => (
          <Star key={item} className={cn("h-4 w-4", item <= rating.score && "fill-current")} />
        ))}
      </div>
      {rating.feedback ? <p className="mt-3 text-sm leading-6 text-slate-600">&ldquo;{rating.feedback}&rdquo;</p> : null}
    </div>
  );
}

export function ConsultationReviewForm({
  appointmentId,
  className,
  onSubmitted,
}: {
  appointmentId: number;
  className?: string;
  onSubmitted?: () => void;
}) {
  const queryClient = useQueryClient();
  const [score, setScore] = useState(5);
  const [feedback, setFeedback] = useState("");
  const ratingMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.submitRating(appointmentId, {
        score,
        feedback: feedback.trim(),
      }),
    onSuccess: async () => {
      setFeedback("");
      onSubmitted?.();
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return (
    <div className={cn("grid gap-3 rounded-[8px] border border-slate-200 bg-slate-50 p-4", className)}>
      <div>
        <p className="text-sm font-semibold text-[#1F2937]">Rate this consultation</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">Add a comment if you want to share what went well.</p>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rate consultation">
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={score === item}
            aria-label={`${item} star${item === 1 ? "" : "s"}`}
            onClick={() => setScore(item)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-[8px] border transition active:scale-95",
              item <= score ? "border-[#BFDBFE] bg-[#DBEAFE] text-[#2563EB]" : "border-slate-200 bg-white text-slate-300",
            )}
          >
            <Star className={cn("h-5 w-5", item <= score && "fill-current")} />
          </button>
        ))}
      </div>
      <Field label="Review comment">
        <Textarea
          value={feedback}
          maxLength={500}
          rows={3}
          placeholder="The doctor was very patient and explained everything clearly."
          onChange={(event) => setFeedback(event.target.value)}
        />
      </Field>
      <p className="text-xs text-slate-500">{feedback.length}/500 characters</p>
      <ErrorMessage error={ratingMutation.error} context="appointments" />
      {ratingMutation.isSuccess ? <Notice title="Review submitted" tone="success" /> : null}
      <Button type="button" className="w-full sm:w-fit" disabled={ratingMutation.isPending} onClick={() => ratingMutation.mutate()}>
        {ratingMutation.isPending ? "Submitting..." : "Submit review"}
      </Button>
    </div>
  );
}
