import { describe, expect, it } from "vitest";
import type { ProviderDoctor } from "@/lib/types/backend";
import { sortRecommendedDoctors, doctorMatchesSpecialty } from "./doctor-ranking";

const doctor = (id: number, extra: Partial<ProviderDoctor> = {}) => ({ id, specialties: [{id:1,name:"General Medicine"}], availability_status:"offline", active_workload:0, upcoming_booking_count:0, ...extra } as ProviderDoctor);

describe("doctor recommendations", () => {
  it("excludes all four test profile IDs even with genuine-looking renamed profiles", () => {
    const rows=[3,6,7,11,20,21].map(id=>doctor(id,{display_name:"General practitioner",availability_status:"available"}));
    expect(sortRecommendedDoctors(rows,"General Medicine").map(d=>d.id).sort()).toEqual([20,21]);
    expect(rows).toHaveLength(6);
  });
  it("puts clinical suitability before online status or workload", () => {
    const matched=doctor(21);const other=doctor(20,{specialties:[{id:2,name:"Dermatology"}],availability_status:"available"});
    expect(sortRecommendedDoctors([other,matched],"general_medicine",1)[0].id).toBe(21);
    expect(doctorMatchesSpecialty(matched,"general_medicine")).toBe(true);
  });
  it("prefers available doctors and then lower actual workload among suitable doctors", () => {
    const a=doctor(20,{upcoming_booking_count:5});const b=doctor(21,{upcoming_booking_count:1});
    expect(sortRecommendedDoctors([a,b],"General Medicine",3)[0].id).toBe(21);
    expect(sortRecommendedDoctors([a,{...b,availability_status:"available"}],"General Medicine",3)[0].id).toBe(21);
  });
  it("does not preserve the API first doctor as the winner for every triage", () => {
    const doctors=[doctor(20),doctor(21),doctor(22)];
    const winners=new Set(Array.from({length:30},(_,seed)=>sortRecommendedDoctors(doctors,"general_medicine",seed)[0].id));
    expect(winners.size).toBeGreaterThan(1);
    expect(sortRecommendedDoctors(doctors,"general_medicine",7)).toEqual(sortRecommendedDoctors([...doctors].reverse(),"general_medicine",7));
    expect(doctors.map(d=>d.id)).toEqual([20,21,22]);
  });
  it("excludes explicitly unavailable doctors while allowing offline doctors for future appointments", () => {
    expect(sortRecommendedDoctors([doctor(20,{availability_status:"unavailable"}),doctor(21)],"general_medicine").map(d=>d.id)).toEqual([21]);
  });
});
