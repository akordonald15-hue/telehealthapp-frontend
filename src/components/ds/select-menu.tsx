"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, Ref } from "react";

import { cn } from "@/lib/utils";

// Figma "DESIGN SYSTEM" → Dropdown. A combobox trigger opens a listbox with
// 48px rows, a 350px/288px scrollable menu, and a primary-500 check on the
// selected row. Use inside <Field labelAs="div"> so the label is not a
// wrapping <label> (a wrapping label would merge the selected value into the
// accessible name and re-activate the trigger when an option is clicked).
export type SelectMenuOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  options: SelectMenuOption[];
  value?: string;
  defaultValue?: string;
  defaultOpen?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  tone?: "default" | "success";
  className?: string;
  menuClassName?: string;
  emptyMessage?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
  ref?: Ref<HTMLButtonElement>;
};

const triggerBase =
  "flex min-h-14 w-full items-center justify-between gap-3 rounded-[16px] border-[1.5px] border-grey-200 bg-grey-50 px-[18px] text-left font-manrope text-base leading-5 text-black-500 outline-none transition hover:border-grey-400 hover:bg-primary-50 focus-visible:border-primary-500 focus-visible:bg-primary-50 focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed disabled:border-grey-300 disabled:bg-grey-200 disabled:text-grey-400 aria-[invalid=true]:border-danger-500 aria-[invalid=true]:bg-danger-50";

const successTrigger =
  "border-success-500 bg-success-50 hover:border-success-500 focus-visible:border-success-500";

const openTrigger = "border-primary-600 bg-white hover:border-primary-600 hover:bg-white";

function assignRef(ref: Ref<HTMLButtonElement> | undefined, node: HTMLButtonElement | null) {
  if (typeof ref === "function") {
    ref(node);
    return;
  }
  if (ref) {
    ref.current = node;
  }
}

export function SelectMenu({
  options,
  value,
  defaultValue,
  defaultOpen = false,
  onChange,
  onBlur,
  id,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  tone = "default",
  className,
  menuClassName,
  emptyMessage = "No options available",
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-labelledby": ariaLabelledBy,
  ref,
}: SelectMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [activeIndex, setActiveIndex] = useState(() => {
    if (!defaultOpen) return -1;
    const initial = defaultValue ?? value ?? "";
    const index = options.findIndex((option) => option.value === initial);
    return index >= 0 ? index : 0;
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const valueId = `${listboxId}-value`;

  const currentValue = value === undefined ? internalValue : value;
  const selectedOption = options.find((option) => option.value === currentValue);
  const highlightedIndex =
    options.length === 0 ? -1 : Math.min(activeIndex < 0 ? 0 : activeIndex, options.length - 1);

  const openMenu = () => {
    if (disabled) return;
    const selectedIndex = options.findIndex((option) => option.value === currentValue);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (option: SelectMenuOption) => {
    if (value === undefined) {
      setInternalValue(option.value);
    }
    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || highlightedIndex < 0) return;
    const node = document.getElementById(`${listboxId}-option-${highlightedIndex}`);
    node?.scrollIntoView?.({ block: "nearest" });
  }, [highlightedIndex, listboxId, open]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) => Math.min(Math.max(current, 0) + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => Math.max(Math.max(current, 0) - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          choose(options[highlightedIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const accessibleLabelledBy =
    [ariaLabelledBy, selectedOption ? valueId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={(node) => {
          triggerRef.current = node;
          assignRef(ref, node);
        }}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
        }
        aria-required={required || undefined}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-labelledby={accessibleLabelledBy}
        disabled={disabled}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          openMenu();
        }}
        onKeyDown={handleTriggerKeyDown}
        onBlur={onBlur}
        className={cn(triggerBase, !open && tone === "success" && successTrigger, open && openTrigger, className)}
      >
        <span id={valueId} className={cn("truncate", !selectedOption && "text-grey-400")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-5 shrink-0 text-grey-500 transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={ariaLabelledBy}
          className={cn(
            "absolute left-0 top-full z-50 mt-2 max-h-72 w-[350px] max-w-full overflow-y-auto rounded-[8px] bg-white p-2 shadow-500",
            menuClassName,
          )}
        >
          <div className="grid gap-2">
            {options.length === 0 ? (
              <div role="option" aria-selected="false" aria-disabled="true" className="px-3 py-4 type-helper-text text-grey-500">
                {emptyMessage}
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === currentValue;
                const isActive = index === highlightedIndex;

                return (
                  <button
                    key={option.value}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      choose(option);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-[6px] px-3 pr-4 text-left type-input-text text-black-500 transition",
                      isActive ? "bg-grey-50" : "hover:bg-grey-50",
                    )}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-[8px]",
                        isSelected ? "bg-primary-500 text-white" : "invisible",
                      )}
                    >
                      <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
