import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Field, SelectMenu } from "@/components/ds";

const options = [
  { value: "lagos", label: "Lagos" },
  { value: "abia", label: "Abia" },
  { value: "akwa-ibom", label: "Akwa Ibom" },
];

function Controlled({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <Field label="State" labelAs="div">
      <SelectMenu
        options={options}
        value={value}
        placeholder="Select a state"
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
      />
    </Field>
  );
}

describe("SelectMenu", () => {
  it("opens, selects with the mouse, and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    const trigger = screen.getByRole("combobox", { name: "State" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: /Akwa Ibom/ }));
    expect(onChange).toHaveBeenCalledWith("akwa-ibom");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveTextContent("Akwa Ibom");
  });

  it("supports keyboard open, move, and select", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    const trigger = screen.getByRole("combobox", { name: "State" });
    trigger.focus();

    await user.keyboard("{ArrowDown}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-activedescendant", expect.stringContaining("-option-0"));

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("abia");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveTextContent("Abia");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    const trigger = screen.getByRole("combobox", { name: "State" });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("exposes the label, required state, and error to assistive technology", () => {
    render(
      <Field label="State" error="Select a state." labelAs="div" required>
        <SelectMenu options={options} value="" onChange={() => undefined} placeholder="Select a state" />
      </Field>,
    );

    const trigger = screen.getByRole("combobox", { name: "State" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute("aria-required", "true");
    expect(screen.getByText("Select a state.")).toHaveAttribute("role", "alert");
  });
});
