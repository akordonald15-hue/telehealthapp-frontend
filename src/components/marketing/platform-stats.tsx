import { platformStats } from "@/features/marketing/data";

export function PlatformStats() {
  return (
    <dl className="mx-auto grid w-[900px] max-w-full grid-cols-2 lg:grid-cols-4">
      {platformStats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col-reverse items-center justify-end border-[#1E40AFE5] px-2 py-[20px] text-center max-lg:even:border-l lg:border-l lg:first:border-l-0"
        >
          <dt className="mt-[12px] text-[15.5px] leading-tight text-[#4B4B5C] max-sm:text-[14px]">{stat.label}</dt>
          <dd className="text-[30px] font-bold leading-none text-[#3472EF] max-sm:text-[24px]">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
