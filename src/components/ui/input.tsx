import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20",
        className,
      )}
      {...props}
    />
  );
}
