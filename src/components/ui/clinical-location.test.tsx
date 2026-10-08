import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ClinicalLocation } from "./clinical-location";

describe("clinical current-location confirmation", () => {
  it("is not preselected and distinguishes Nigeria consultations from Akwa Ibom visits", async () => {
    const onChange = vi.fn();
    render(<ClinicalLocation confirmed={false} onChange={onChange} />);
    const checkbox = screen.getByRole("checkbox", { name: "I confirm that I am currently in Nigeria." });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText(/Home visits are currently available in Akwa Ibom State, Nigeria/)).toBeVisible();
    await userEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
