// Use the same hourly choices as the existing scheduling sheet. These are
// candidate times, not a promise of availability; PR3 validates under its lock.
export const hourlyConsultationSlots = Array.from({ length: 10 }, (_, i) => 8 + i);

export function earliestConsultationSlot(now: Date, unavailable: string[] = []) {
  const blocked = new Set(unavailable.map((value) => new Date(value).getTime()));
  for (let day = 0; day < 2; day++) {
    for (const hour of hourlyConsultationSlots) {
      const slot = new Date(now);
      slot.setDate(slot.getDate() + day);
      slot.setHours(hour, 0, 0, 0);
      if (slot.getTime() > now.getTime() && !blocked.has(slot.getTime())) return slot;
    }
  }
  return null;
}
