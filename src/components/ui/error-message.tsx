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
    | "registration"
    | "verification"
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
    <div className="rounded-[8px] border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-800 shadow-400">
      {error instanceof ApiError || error instanceof Error
        ? getFriendlyErrorMessage(error, context)
        : "Something went wrong. Please try again."}
    </div>
  );
}
