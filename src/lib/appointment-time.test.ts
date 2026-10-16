import { describe, expect, it } from "vitest";
import { lagosSelectionToInstant, formatAppointmentTime, lagosCalendarDate } from "./appointment-time";

describe("Lagos appointment selection boundary", () => {
  for (const zone of ["Africa/Lagos", "UTC", "America/New_York", "Europe/London"]) {
    for (const [local, utc] of [["08:00", "2026-10-20T07:00:00.000Z"], ["14:00", "2026-10-20T13:00:00.000Z"], ["00:30", "2026-10-19T23:30:00.000Z"], ["23:30", "2026-10-20T22:30:00.000Z"]]) {
      it(`${zone}: ${local} preserves Lagos wall time`, () => {
        const previous = process.env.TZ;
        try { process.env.TZ = zone;
          expect(lagosSelectionToInstant(`2026-10-20T${local}`)).toBe(utc);
          expect(lagosSelectionToInstant(utc)).toBe(utc);
          expect(formatAppointmentTime(utc)).toContain(local);
          const calendar = lagosCalendarDate(new Date(utc));
          expect(`${String(calendar.getHours()).padStart(2, "0")}:${String(calendar.getMinutes()).padStart(2, "0")}`).toBe(local);
          expect(calendar.getDate()).toBe(20);
        } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
      });
    }
  }
  it("preserves offset instants and rejects malformed selections", () => {
    expect(lagosSelectionToInstant("2026-10-20T08:00:00+01:00")).toBe("2026-10-20T07:00:00.000Z");
    expect(() => lagosSelectionToInstant("bad")).toThrow();
  });
});
