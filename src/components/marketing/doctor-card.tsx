import Image from "next/image";
type DoctorCardProps = {
  doctor: {
    name: string;
    image: string;
  };
};

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <article className="ct-hover-lift flex h-full flex-col overflow-hidden rounded-[22px] border border-[rgba(219,229,241,0.92)] bg-white shadow-[0_16px_42px_-34px_rgba(15,23,42,0.24)] hover:border-[rgba(66,107,179,0.18)] hover:shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)]">
      <Image
        src={doctor.image}
        alt={doctor.name}
        width={900}
        height={285}
        unoptimized
        className="h-[240px] w-full object-cover object-top sm:h-[260px] xl:h-[280px]"
      />
      <div className="flex h-full items-center justify-center p-5 text-center">
        <h3 className="ct-card-title text-[#1F2937]">{doctor.name}</h3>
      </div>
    </article>
  );
}
