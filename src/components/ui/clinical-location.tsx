"use client";

import { Notice } from "./notice";

export function ClinicalLocation({ confirmed, onChange }: { confirmed: boolean; onChange: (value: boolean) => void }) {
  return (
    <Notice title="Clinical care in Nigeria" tone="neutral">
      <p>Doctor consultations are currently available to patients located in Nigeria. Home visits are currently available in Akwa Ibom State, Nigeria.</p>
      <label className="mt-3 flex items-start gap-2 text-sm font-semibold">
        <input type="checkbox" checked={confirmed} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4" />
        I confirm that I am currently in Nigeria.
      </label>
    </Notice>
  );
}
