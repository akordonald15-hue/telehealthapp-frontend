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
    <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-[rgba(229,231,235,0.88)] bg-white shadow-[0_10px_30px_rgba(31,41,55,0.08)] transition duration-200 hover:-translate-y-1 hover:border-[rgba(37,99,235,0.22)] hover:shadow-[0_24px_60px_rgba(31,41,55,0.12)]">
      <Image
        src={doctor.image}
        alt={doctor.name}
        width={900}
        height={285}
        unoptimized
        className="h-[220px] w-full object-cover object-top sm:h-[240px] xl:h-[230px]"
      />
      <div className="flex h-full flex-col gap-4 p-5">
        <div>
          <h3 className="font-heading text-[1.08rem] font-extrabold text-[#1F2937]">{doctor.name}</h3>
          <p className="mt-2 text-sm font-semibold text-[var(--primary)]">{doctor.specialty}</p>
          <p className="mt-2 text-sm text-slate-600">{doctor.bio}</p>
        </div>
        <div className="mt-auto rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{doctor.qualification}</p>
          <p className="mt-1 text-sm font-medium text-[#1F2937]">{doctor.experience}</p>
        </div>
      </div>
    </article>
  );
}
