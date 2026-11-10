import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Figma "DESIGN SYSTEM" → Input, Style=Filled. Hover and focus tint the field; aria-invalid shows the Error state.
// fieldSize "lg" (default) = the 56px field used on the app screens; "md" = Figma Medium (40px) for compact spots.
type FieldSize = "md" | "lg";
type SizeProp = { fieldSize?: FieldSize };

const fieldSizes: Record<FieldSize, string> = {
  lg: "min-h-14 rounded-[16px] px-[18px] text-base leading-5",
  md: "min-h-10 rounded-[8px] px-3 text-sm leading-4",
};

const baseField =
  "w-full border-[1.5px] border-grey-200 bg-grey-50 font-manrope text-black-500 outline-none transition placeholder:text-grey-400 hover:border-grey-400 hover:bg-primary-50 focus:border-primary-500 focus:bg-primary-50 disabled:cursor-not-allowed disabled:border-grey-300 disabled:bg-grey-200 disabled:text-grey-400 aria-[invalid=true]:border-danger-500 aria-[invalid=true]:bg-danger-50";

export function Input({ className, fieldSize = "lg", ...props }: InputHTMLAttributes<HTMLInputElement> & SizeProp) {
  return (
    <input
      className={cn(baseField, fieldSizes[fieldSize], className)}
      {...props}
    />
  );
}

export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement> & SizeProp) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        className={cn("pr-14", className)}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[12px] text-grey-500 transition hover:bg-primary-100 hover:text-primary-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(baseField, "min-h-32 rounded-[16px] px-[18px] py-[18px] text-base leading-5", className)}
      {...props}
    />
  );
}

// Figma → Dropdown trigger. Native <select> keeps keyboard and screen-reader support; the chevron
// is drawn by .ds-select-chevron in globals.css.
export function Select({ className, fieldSize = "lg", ...props }: SelectHTMLAttributes<HTMLSelectElement> & SizeProp) {
  return (
    <select
      className={cn(baseField, fieldSizes[fieldSize], "ds-select-chevron cursor-pointer appearance-none", fieldSize === "lg" ? "pr-12" : "pr-9", className)}
      {...props}
    />
  );
}
