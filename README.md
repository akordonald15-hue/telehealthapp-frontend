This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

Create `.env.local` from `.env.example` and point the frontend at the backend API:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
BACKEND_API_BASE_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_WS_BASE_URL=ws://127.0.0.1:8001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For Vercel, set the same variables with production `https` and `wss` values.

## Local Role QA

This frontend repo does not include a seed fixture. Use backend-created accounts for role testing:

- Patient: register through the frontend, verify email through the backend OTP flow, then sign in.
- Doctor: create or promote a backend user with role `doctor` and a matching `DoctorProfile`.
- Nurse: create a backend user with role `nurse` and an approved, dispatch-ready `NurseProfile`.
- Admin: create a Django superuser or backend user with role `admin`.

Before hosting, sign in once as each role and verify:

- Patient can open `/home-care/book`, create a direct request, view `/home-care/requests`, open request detail, cancel while allowed, confirm completion only after care completion, and rate only after confirmation.
- Patient can select `Doctor referral` on `/home-care/book` when a sent referral exists.
- Nurse can open `/dashboard`, `/nurse/requests`, `/nurse/request/{id}`, and `/nurse/history`.
- Doctor/admin navigation still excludes nurse-only actions.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
