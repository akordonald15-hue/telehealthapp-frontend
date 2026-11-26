import { UserRoundCheck } from "lucide-react";
import type { ReactNode } from "react";

export function SignupCard({
  title = "Create a new account",
  subtitle = "Please kindly input your details",
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-grey-200 p-2.5">
      <div className="rounded-md bg-white p-[30px] max-[399px]:p-5">
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="inline-flex size-[60px] items-center justify-center rounded-full border-4 border-grey-200 bg-white text-black-500">
            <UserRoundCheck aria-hidden="true" className="size-6" />
          </span>
          <div className="grid gap-1">
            <h1 className="type-page-title text-black-500">{title}</h1>
            <p className="type-body-lg text-grey-500">{subtitle}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-6">{children}</div>
      </div>
    </div>
  );
}
