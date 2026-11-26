"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useId } from "react";
import type { ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ds/button";
import { Checkbox } from "@/components/ds/choice";
import { Field } from "@/components/ds/field";
import { Input, PasswordInput } from "@/components/ds/input";
import { GoogleAuthButton } from "@/features/auth/google-auth-button";

import { signupAccountSchema, signupEmailSchema } from "./signup-schema";
import type { SignupAccountInput, SignupEmailInput } from "./signup-schema";

export type SignupFormErrors = {
  email?: string;
  password?: string;
  phone?: string;
  referral?: string;
  terms?: string;
};

type CommonProps = {
  isSubmitting?: boolean;
  serverError?: string;
  fieldErrors?: SignupFormErrors;
};

export type SignupAccountValues = {
  email: string;
  password: string;
  phone: string;
  referral: string;
  terms: boolean;
};

const googleContainerClassName =
  "min-h-14 rounded-[18px] border border-grey-100 bg-white px-1 py-1 shadow-[inset_0_0_0_6px_var(--color-grey-50)]";

const termsLinkClassName = "text-primary-500 underline underline-offset-2 hover:text-primary-600";

function SignupDivider() {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="h-px flex-1 bg-grey-200" />
      <span className="type-body-md text-grey-500">Or login with</span>
      <span aria-hidden="true" className="h-px flex-1 bg-grey-200" />
    </div>
  );
}

function SignupFooter() {
  return (
    <p className="type-body-md text-center text-grey-500">
      Have an account?{" "}
      <Link className={termsLinkClassName} href="/login">
        Login
      </Link>
    </p>
  );
}

function SignupGoogle() {
  return <GoogleAuthButton mode="signup" containerClassName={googleContainerClassName} />;
}

function ServerError({ children }: { children?: ReactNode }) {
  if (!children) {
    return null;
  }

  return (
    <p role="alert" className="type-helper-text text-danger-600">
      {children}
    </p>
  );
}

export function SignupEmailForm({
  initialEmail = "",
  onValid,
  isSubmitting = false,
  serverError,
  fieldErrors,
}: CommonProps & {
  initialEmail?: string;
  onValid: (values: SignupEmailInput) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<SignupEmailInput>({
    resolver: zodResolver(signupEmailSchema),
    defaultValues: { email: initialEmail },
    mode: "onTouched",
  });

  const email = useWatch({ control, name: "email" }) ?? "";
  const submitting = isSubmitting || isFormSubmitting;
  const emailError = errors.email?.message ?? fieldErrors?.email;

  return (
    <form
      className="grid gap-6"
      noValidate
      aria-busy={submitting || undefined}
      onSubmit={handleSubmit((values) => onValid(values))}
    >
      <ServerError>{serverError}</ServerError>

      <div className="grid gap-3">
        <Field label="Email" error={emailError} required>
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Input your Email"
            {...register("email")}
          />
        </Field>
      </div>

      <Button type="submit" size="xl" className="w-full" disabled={submitting || email.trim().length === 0}>
        {submitting ? "Sending your code..." : "Sign up"}
      </Button>

      <SignupDivider />
      <SignupGoogle />
      <SignupFooter />
    </form>
  );
}

export function SignupAccountForm({
  onValid,
  defaultValues,
  isSubmitting = false,
  serverError,
  fieldErrors,
}: CommonProps & {
  onValid: (values: SignupAccountInput) => void;
  defaultValues?: SignupAccountValues;
}) {
  const termsErrorId = useId();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<SignupAccountInput>({
    resolver: zodResolver(signupAccountSchema),
    defaultValues: defaultValues ?? {
      email: "",
      password: "",
      phone: "",
      referral: "",
      terms: false,
    },
    mode: "onTouched",
  });

  const password = useWatch({ control, name: "password" }) ?? "";
  const terms = useWatch({ control, name: "terms" }) ?? false;
  const submitting = isSubmitting || isFormSubmitting;

  const passwordError = errors.password?.message ?? fieldErrors?.password;
  const termsError = errors.terms?.message ?? fieldErrors?.terms;
  const passwordValid = password.length >= 8 && !passwordError;

  return (
    <form
      className="grid gap-6"
      noValidate
      aria-busy={submitting || undefined}
      onSubmit={handleSubmit((values) => onValid(values))}
    >
      <ServerError>{serverError}</ServerError>

      <div className="grid gap-3">
        <Field label="Email" error={errors.email?.message ?? fieldErrors?.email} required>
          <Input type="email" autoComplete="email" readOnly {...register("email")} />
        </Field>

        <Field
          label="Password"
          error={passwordError}
          success={passwordValid ? "Password meets the requirements" : undefined}
          hint="Minimum 8 characters"
          required
        >
          <PasswordInput
            autoComplete="new-password"
            placeholder="Input your password"
            {...register("password")}
          />
        </Field>

        <Field label="Phone" error={errors.phone?.message ?? fieldErrors?.phone} required>
          <Input
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="08012345678 or +2348012345678"
            {...register("phone")}
          />
        </Field>

        <Field
          label="Referral code (optional)"
          error={errors.referral?.message ?? fieldErrors?.referral}
          hint="Pre-filled if you arrived from an invite link. You can change or remove it."
        >
          <Input
            placeholder="e.g. DONALD7K3Q"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            {...register("referral")}
          />
        </Field>
      </div>

      <div className="grid gap-2">
        <Checkbox
          required
          aria-invalid={Boolean(termsError) || undefined}
          aria-describedby={termsError ? termsErrorId : undefined}
          className="-my-2.5 min-h-11 gap-3 py-2.5 text-sm leading-5"
          label={
            <>
              I agree to the{" "}
              <Link className={termsLinkClassName} href="/terms" onClick={(event) => event.stopPropagation()}>
                Terms
              </Link>{" "}
              and{" "}
              <Link className={termsLinkClassName} href="/privacy" onClick={(event) => event.stopPropagation()}>
                Privacy
              </Link>{" "}
              Agreement
              <span className="ml-1 text-danger-500" aria-hidden="true">
                *
              </span>
            </>
          }
          {...register("terms")}
        />
        {termsError ? (
          <p id={termsErrorId} role="alert" className="type-helper-text text-danger-600">
            {termsError}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="xl" className="w-full" disabled={submitting || !terms}>
        {submitting ? "Creating your account..." : "Sign up"}
      </Button>

      <SignupFooter />
    </form>
  );
}
