import { ApiError } from "@/lib/api/client";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";

export function ErrorMessage({
  error,
  context = "generic",
}: {
  error: unknown;
  context?:
    | "generic"
    | "auth"
    | "dashboard"
    | "appointments"
    | "messages"
    | "messageSend"
    | "payments"
    | "paymentCheckout"
    | "records"
    | "recordUpload"
    | "referrals"
    | "triage"
    | "profile";
}) {
  if (!error) {
    return null;
  }

  return (
    <div className="rounded-[18px] border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 shadow-[0_10px_30px_rgba(225,29,72,0.08)]">
      {error instanceof ApiError || error instanceof Error
        ? getFriendlyErrorMessage(error, context)
        : "Something went wrong. Please try again."}
    </div>
  );
}
