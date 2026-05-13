import Image from "next/image";
type DoctorCardProps = {
  doctor: {
    name: string;
    specialty: string;
    qualification: string;
    experience: string;
    image: string;
    bio: string;
  };
};

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <article className="ct-card flex h-full flex-col overflow-hidden rounded-[26px]">
      <Image
        src={doctor.image}
        alt={doctor.name}
        width={900}
        height={285}
        unoptimized
        className="h-[260px] w-full object-cover object-top sm:h-[290px] xl:h-[260px]"
      />
      <div className="flex h-full flex-col gap-5 p-6">
        <div>
          <p className="ct-caption font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Available doctor</p>
          <h3 className="ct-card-title mt-3 text-[#1F2937]">{doctor.name}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--primary)]">{doctor.specialty}</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{doctor.bio}</p>
        </div>
        <div className="mt-auto grid gap-3">
          <div className="rounded-[18px] border border-slate-200/90 bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{doctor.qualification}</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#1F2937]">{doctor.experience}</p>
          </div>
          <div className="flex items-center justify-between rounded-[18px] border border-slate-200/80 bg-white/90 px-4 py-3">
            <span className="text-sm font-semibold text-slate-600">Consultation ready</span>
            <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">Online care</span>
          </div>
        </div>
      </div>
    </article>
  );
}
