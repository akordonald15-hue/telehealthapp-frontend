"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox, Radio, Toggle } from "@/components/ui/choice";
import { Field } from "@/components/ui/field";
import { Input, PasswordInput, Select, Textarea } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";

// Living reference for the Figma "DESIGN SYSTEM" page: every token and component in its states.
// Compare this page with Figma when changing src/components/ui or the tokens in globals.css.

const scales = ["primary", "grey", "black", "success", "danger", "warning", "info"] as const;
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

// Literal class names so Tailwind generates them.
const swatch: Record<(typeof scales)[number], string[]> = {
  primary: ["bg-primary-50", "bg-primary-100", "bg-primary-200", "bg-primary-300", "bg-primary-400", "bg-primary-500", "bg-primary-600", "bg-primary-700", "bg-primary-800", "bg-primary-900"],
  grey: ["bg-grey-50", "bg-grey-100", "bg-grey-200", "bg-grey-300", "bg-grey-400", "bg-grey-500", "bg-grey-600", "bg-grey-700", "bg-grey-800", "bg-grey-900"],
  black: ["bg-black-50", "bg-black-100", "bg-black-200", "bg-black-300", "bg-black-400", "bg-black-500", "bg-black-600", "bg-black-700", "bg-black-800", "bg-black-900"],
  success: ["bg-success-50", "bg-success-100", "bg-success-200", "bg-success-300", "bg-success-400", "bg-success-500", "bg-success-600", "bg-success-700", "bg-success-800", "bg-success-900"],
  danger: ["bg-danger-50", "bg-danger-100", "bg-danger-200", "bg-danger-300", "bg-danger-400", "bg-danger-500", "bg-danger-600", "bg-danger-700", "bg-danger-800", "bg-danger-900"],
  warning: ["bg-warning-50", "bg-warning-100", "bg-warning-200", "bg-warning-300", "bg-warning-400", "bg-warning-500", "bg-warning-600", "bg-warning-700", "bg-warning-800", "bg-warning-900"],
  info: ["bg-info-50", "bg-info-100", "bg-info-200", "bg-info-300", "bg-info-400", "bg-info-500", "bg-info-600", "bg-info-700", "bg-info-800", "bg-info-900"],
};

const textStyles = [
  ["type-heading-1", "Heading 1"],
  ["type-heading-2", "Heading 2"],
  ["type-heading-3", "Heading 3"],
  ["type-heading-4", "Heading 4"],
  ["type-page-title", "Page title"],
  ["type-section-heading", "Section heading"],
  ["type-card-title", "Card title"],
  ["type-modal-title", "Modal title"],
  ["type-body-giant", "Body giant"],
  ["type-body-lg", "Body large"],
  ["type-body-md", "Body medium"],
  ["type-body-sm", "Body small"],
  ["type-input-text", "Input text"],
  ["type-helper-text", "Helper text"],
  ["type-table-data", "Table data"],
  ["type-status-tag", "Status tag"],
  ["type-muted-label", "Muted label"],
  ["type-cta-button", "CTA button"],
  ["type-nav-item", "Nav item"],
] as const;

const shadows = ["shadow-100", "shadow-200", "shadow-300", "shadow-400", "shadow-500", "shadow-600", "shadow-700", "shadow-800"] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 rounded-[24px] border border-grey-200 bg-white p-6 shadow-200">
      <h2 className="type-section-heading text-grey-900">{title}</h2>
      {children}
    </section>
  );
}

export function DesignSystemShowcase() {
  const [toggleOn, setToggleOn] = useState(true);
  const [toggleOff, setToggleOff] = useState(false);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <header className="grid gap-2">
        <p className="type-status-tag uppercase text-primary-500">Caretekk</p>
        <h1 className="type-heading-3 text-grey-900">Design system</h1>
        <p className="type-body-lg text-grey-600">
          Tokens and components from the Figma &quot;DESIGN SYSTEM&quot; page. Usage: docs/design-system.md.
        </p>
      </header>

      <Section title="Colours">
        <div className="grid gap-3">
          {scales.map((scale) => (
            <div key={scale} className="grid grid-cols-[80px_1fr] items-center gap-3">
              <span className="type-body-md capitalize text-grey-700">{scale}</span>
              <div className="grid grid-cols-10 gap-1">
                {swatch[scale].map((cls, index) => (
                  <div key={cls} className="grid gap-1">
                    <span className={`h-10 rounded-[8px] border border-grey-200 ${cls}`} />
                    <span className="type-muted-label text-center text-grey-500">{steps[index]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Text styles">
        <div className="grid gap-3">
          {textStyles.map(([cls, name]) => (
            <div key={cls} className="grid gap-1 border-b border-grey-100 pb-3 sm:grid-cols-[180px_1fr] sm:items-baseline">
              <code className="type-table-data text-grey-500">{cls}</code>
              <p className={`${cls} text-grey-900`}>{name} — The quick brown fox</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadows">
        <div className="grid grid-cols-2 gap-6 bg-grey-50 p-6 sm:grid-cols-4">
          {shadows.map((cls) => (
            <div key={cls} className={`grid h-20 place-items-center rounded-[12px] bg-white type-body-md text-grey-700 ${cls}`}>
              {cls}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        {(["primary", "secondary", "ghost", "danger"] as const).map((variant) => (
          <div key={variant} className="grid gap-3">
            <p className="type-body-sm capitalize text-grey-500">{variant}</p>
            <div className="flex flex-wrap items-center gap-3">
              {(["xs", "sm", "compact", "md", "lg"] as const).map((size) => (
                <Button key={size} variant={variant} size={size}>
                  Button <ArrowRight />
                </Button>
              ))}
              <Button variant={variant} disabled>
                Disabled
              </Button>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Inputs">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Default" hint="Helper text">
            <Input placeholder="Placeholder" />
          </Field>
          <Field label="Filled">
            <Input defaultValue="Ada Okon" />
          </Field>
          <Field label="Error" error="Error text">
            <Input defaultValue="ada@" />
          </Field>
          <Field label="Disabled">
            <Input placeholder="Placeholder" disabled />
          </Field>
          <Field label="Password">
            <PasswordInput placeholder="Enter your password" />
          </Field>
          <Field label="Dropdown">
            <Select defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option>Option 1</option>
              <option>Option 2</option>
            </Select>
          </Field>
          <Field label="Medium size">
            <Input fieldSize="md" placeholder="Placeholder" />
          </Field>
          <Field label="Text area">
            <Textarea placeholder="Describe your symptoms" />
          </Field>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">Confirmed</Badge>
          <Badge tone="green">Completed</Badge>
          <Badge tone="amber">Pending</Badge>
          <Badge tone="rose">Cancelled</Badge>
          <Badge tone="cyan">Info</Badge>
          <Badge>Neutral</Badge>
        </div>
      </Section>

      <Section title="Checkbox, radio, toggle">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-3">
            <Checkbox label="Default" />
            <Checkbox label="Selected" defaultChecked />
            <Checkbox label="Disabled" disabled />
          </div>
          <div className="grid gap-3">
            <Radio name="demo-radio" label="Default" />
            <Radio name="demo-radio" label="Selected" defaultChecked />
            <Radio label="Disabled" disabled />
          </div>
          <div className="grid gap-3">
            <Toggle label="On" checked={toggleOn} onCheckedChange={setToggleOn} />
            <Toggle label="Off" checked={toggleOff} onCheckedChange={setToggleOff} />
            <Toggle label="Disabled" checked={false} onCheckedChange={() => undefined} disabled />
          </div>
        </div>
      </Section>

      <Section title="Progress bar and breadcrumbs">
        <ProgressBar label="Profile completion" value={60} />
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Appointments", href: "/appointments" }, { label: "Details" }]} />
      </Section>
    </main>
  );
}
