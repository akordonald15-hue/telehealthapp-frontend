/** Appointment wall-clock selections belong to the Lagos clinic, not the device zone. */
export const APPOINTMENT_TIME_ZONE = "Africa/Lagos";

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APPOINTMENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

export function lagosSelectionToInstant(value: string): string {
  // Already-normalized instants must retain their identity (including recovery).
  if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return new Date(value).toISOString();
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Invalid appointment date/time");
  const [, year, month, day, hour, minute] = match.map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let instant = wall;
  // Resolve the IANA zone offset through Intl, independently of device timezone.
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = Object.fromEntries(partsFormatter.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
    const represented = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    const correction = wall - represented;
    instant += correction;
    if (!correction) return new Date(instant).toISOString();
  }
  throw new Error("Invalid appointment date/time");
}

export function formatAppointmentTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: APPOINTMENT_TIME_ZONE,
    dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

/** Calendar-only carrier: read local fields; never submit this Date as an instant. */
export function lagosCalendarDate(instant: Date): Date {
  const p = Object.fromEntries(partsFormatter.formatToParts(instant).map(part => [part.type, part.value]));
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}
