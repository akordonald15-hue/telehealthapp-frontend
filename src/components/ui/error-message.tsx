import { ApiError } from "@/lib/api/client";

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }

  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
      {error instanceof ApiError || error instanceof Error ? error.message : "Something went wrong."}
    </div>
  );
}
