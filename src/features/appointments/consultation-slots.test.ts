import { describe, expect, it } from "vitest";
import { earliestConsultationSlot } from "./consultation-slots";

describe("future hourly scheduling contract", () => {
  it("offers an existing hourly choice instead of an immediate/past request", () => {
    const now = new Date(2026, 9, 15, 12, 34, 56);
    expect(earliestConsultationSlot(now)).toEqual(new Date(2026, 9, 15, 13));
  });
  it("excludes the exact current-time boundary", () => {
    expect(earliestConsultationSlot(new Date(2026, 9, 15, 13)))
      .toEqual(new Date(2026, 9, 15, 14));
  });
  it("preserves explicit offset conversion without stripping seconds into the past", () => {
    const now = new Date("2026-10-15T12:34:56+01:00");
    const slot = earliestConsultationSlot(now)!;
    expect(slot.getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(slot.toISOString()).getTime()).toBe(slot.getTime());
    expect(slot.getMinutes()).toBe(0);
  });
  it("rolls over to tomorrow's existing first slot after the last slot", () => {
    expect(earliestConsultationSlot(new Date(2026, 9, 15, 23, 59)))
      .toEqual(new Date(2026, 9, 16, 8));
  });
  it("skips server-reported unavailable slots", () => {
    expect(earliestConsultationSlot(new Date(2026, 9, 15, 16, 59),
      [new Date(2026, 9, 15, 17).toISOString()]))
      .toEqual(new Date(2026, 9, 16, 8));
  });
  it("does not invent availability when today and tomorrow are exhausted", () => {
    const blocked = Array.from({ length: 10 }, (_, i) => new Date(2026, 9, 16, 8 + i).toISOString());
    expect(earliestConsultationSlot(new Date(2026, 9, 15, 23), blocked)).toBeNull();
  });
});
