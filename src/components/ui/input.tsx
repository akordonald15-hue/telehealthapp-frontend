import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#1F2937] outline-none transition shadow-[0_6px_20px_rgba(31,41,55,0.03)] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10",
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
        "min-h-32 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3.5 py-3 text-sm text-[#1F2937] outline-none transition shadow-[0_6px_20px_rgba(31,41,55,0.03)] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10",
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
        "min-h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#1F2937] outline-none transition shadow-[0_6px_20px_rgba(31,41,55,0.03)] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10",
        className,
      )}
      {...props}
    />
  );
}
