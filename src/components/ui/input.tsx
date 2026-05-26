import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-[14px] border border-ash-200 bg-surface px-4 text-sm text-ash-800 shadow-[0_8px_24px_rgba(31,41,55,0.035)] outline-none transition placeholder:text-ash-400 focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 aria-[invalid=true]:border-rose-300 aria-[invalid=true]:focus:ring-rose-100";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(baseField, "min-h-12", className)}
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
        className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[12px] text-ash-500 transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
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
      className={cn(baseField, "min-h-32 py-3.5", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(baseField, "min-h-12", className)}
      {...props}
    />
  );
}
