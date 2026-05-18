"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "./actions";
import Image from "next/image";

function RegisterForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [state, formAction, pending] = useActionState(register, null);

  const loginHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

  return (
    <div className="w-full max-w-sm bg-zinc-50 rounded-lg border border-zinc-200 shadow-sm p-6">
             <div className="mb-8 flex items-center justify-start gap-3">
               <Link href="/" >
               <Image
                 src="/logo.png"
                 alt="Pasteboard"
                 width={110}
                 height={34}
               />
               </Link>
               <span className="h-6 w-px bg-zinc-200" aria-hidden />
               <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                 Sign Up
               </h1>
             </div>


      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">
            Name <span className="text-zinc-400 font-normal">(optional)</span>
          </span>
          <Input name="name" type="text" autoComplete="name" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />
          <span className="text-xs text-zinc-400">
            At least 6 characters.
          </span>
        </label>

        {state?.error && (
          <p
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1.5"
          >
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-zinc-500 mt-6 text-center">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="text-zinc-900 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f5] px-4 py-12">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
