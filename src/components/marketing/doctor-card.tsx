import Image from "next/image";
import Link from "next/link";

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
    <article className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[rgba(229,231,235,0.88)] bg-white shadow-[0_10px_30px_rgba(31,41,55,0.08)] transition duration-200 hover:-translate-y-1.5 hover:border-[rgba(37,99,235,0.22)] hover:shadow-[0_28px_70px_rgba(31,41,55,0.12)]">
      <Image
        src={doctor.image}
        alt={doctor.name}
        width={900}
        height={285}
        unoptimized
        className="h-[280px] w-full object-cover object-top sm:h-[300px] xl:h-[285px]"
      />
      <div className="flex h-full flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#ECFDF5] px-3 py-2 text-[0.75rem] font-black text-[#047857]">{doctor.experience}</span>
          <span className="rounded-full bg-[#EFF6FF] px-3 py-2 text-[0.75rem] font-black text-[#2563EB]">Verified</span>
        </div>
        <div>
          <h3 className="font-heading text-[1.15rem] font-extrabold tracking-[-0.035em] text-[#1F2937]">{doctor.name}</h3>
          <p className="mt-1 min-h-[44px] text-sm font-black leading-6 text-[#2563EB]">{doctor.specialty}</p>
        </div>
        <p className="min-h-[84px] text-[0.94rem] leading-7 text-[#667085]">{doctor.bio}</p>
        <div className="w-fit rounded-full bg-[#ECFDF5] px-3 py-2 text-[0.75rem] font-black text-[#047857]">{doctor.qualification}</div>
        <Link href="/register" className="lf-btn lf-btn-dark mt-auto text-sm">
          Book care
        </Link>
      </div>
    </article>
  );
}
