import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-sm text-[#1F2937] shadow-[0_8px_24px_rgba(31,41,55,0.035)] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 focus-visible:border-[#2563EB] focus-visible:ring-4 focus-visible:ring-[#2563EB]/10 aria-[invalid=true]:border-rose-300 aria-[invalid=true]:focus:ring-rose-100",
        className,
      )}
      {...props}
    />
  );
}

export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        className={cn("pr-12", className)}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[12px] text-slate-500 transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 py-3.5 text-sm text-[#1F2937] shadow-[0_8px_24px_rgba(31,41,55,0.035)] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 focus-visible:border-[#2563EB] focus-visible:ring-4 focus-visible:ring-[#2563EB]/10 aria-[invalid=true]:border-rose-300 aria-[invalid=true]:focus:ring-rose-100",
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
        "min-h-12 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-sm text-[#1F2937] shadow-[0_8px_24px_rgba(31,41,55,0.035)] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 focus-visible:border-[#2563EB] focus-visible:ring-4 focus-visible:ring-[#2563EB]/10 aria-[invalid=true]:border-rose-300 aria-[invalid=true]:focus:ring-rose-100",
        className,
      )}
      {...props}
    />
  );
}
