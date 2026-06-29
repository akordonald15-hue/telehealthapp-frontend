"use client";

export const FILE_PICKER_GRACE_EVENT = "caretekk:file-picker-grace";
export const FILE_PICKER_GRACE_MS = 3 * 60 * 1000;

export function beginFilePickerGrace(durationMs = FILE_PICKER_GRACE_MS) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(FILE_PICKER_GRACE_EVENT, {
      detail: {
        until: Date.now() + durationMs,
      },
    }),
  );
}
