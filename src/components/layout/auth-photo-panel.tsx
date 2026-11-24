import Image from "next/image";

export const AUTH_PANEL_PHOTO = "/img/Dr michael Idam.jpg";

export function AuthPhotoPanel() {
  return (
    <aside className="relative hidden overflow-hidden rounded-lg bg-black-800 lg:sticky lg:top-3 lg:block lg:h-[calc(100dvh-1.5rem)] lg:min-h-[560px] lg:self-start">
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src={AUTH_PANEL_PHOTO}
          alt=""
          fill
          sizes="(min-width: 1024px) 55vw, 1px"
          loading="eager"
          className="object-cover object-[50%_20%]"
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-black-900/40" />
    </aside>
  );
}
