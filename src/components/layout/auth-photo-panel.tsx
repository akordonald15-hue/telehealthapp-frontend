import Image from "next/image";

import { cn } from "@/lib/utils";

export function AuthPhotoPanel({ images, active }: { images: readonly string[]; active: number }) {
  return (
    <aside className="relative hidden overflow-hidden rounded-lg bg-black-800 lg:sticky lg:top-3 lg:block lg:h-[calc(100dvh-1.5rem)] lg:min-h-[560px] lg:self-start">
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="55vw"
          className={cn(
            "object-cover object-[50%_20%] transition-opacity duration-1000 ease-in-out motion-reduce:transition-none",
            index === active ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div aria-hidden="true" className="absolute inset-0 bg-black-900/40" />
    </aside>
  );
}
