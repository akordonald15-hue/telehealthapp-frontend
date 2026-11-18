import type { ProviderDoctor } from "@/lib/types/backend";

// Owner-confirmed test profiles; retain historical appointment displays.
const excludedDoctorIds = new Set([3, 6, 7, 11]);
export function isExcludedDoctorId(id: number) {
  return excludedDoctorIds.has(id);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function doctorMatchesSpecialty(doctor: ProviderDoctor, specialty?: string | null) {
  return Boolean(specialty && doctor.specialties?.some((item) => normalize(item.name) === normalize(specialty)));
}

function tieKey(seed: number, id: number) {
  // Stable per triage, independent of directory update order; not a clinical score.
  let value = (seed ^ Math.imul(id, 0x9e3779b1)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  return (value ^ (value >>> 13)) >>> 0;
}

export function sortRecommendedDoctors(doctors: ProviderDoctor[], specialty?: string | null, seed = 0) {
  return doctors.filter((doctor) => !isExcludedDoctorId(doctor.id) && doctor.availability_status !== "unavailable").sort((a, b) =>
    Number(doctorMatchesSpecialty(b, specialty)) - Number(doctorMatchesSpecialty(a, specialty)) ||
    Number(b.availability_status === "available") - Number(a.availability_status === "available") ||
    (a.active_workload ?? 0) - (b.active_workload ?? 0) ||
    (a.upcoming_booking_count ?? 0) - (b.upcoming_booking_count ?? 0) ||
    tieKey(seed, a.id) - tieKey(seed, b.id) || a.id - b.id,
  );
}
