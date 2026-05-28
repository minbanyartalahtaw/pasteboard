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
    ? `/auth/login?next=${encodeURIComponent(next)}`
    : "/auth/login";

  return (
    <div className="w-full max-w-sm bg-card rounded-lg border border-border shadow-sm p-6">
             <div className="mb-8 flex items-center justify-start gap-3">
               <Link href="/" >
               <Image
                 src="/logo.png"
                 alt="Pasteboard"
                 width={110}
                 height={34}
               />
               </Link>
               <span className="h-6 w-px bg-border" aria-hidden />
               <h1 className="text-xl font-semibold tracking-tight text-foreground">
                 Sign Up
               </h1>
             </div>


      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Name <span className="text-muted-foreground font-normal">(optional)</span>
          </span>
          <Input name="name" type="text" autoComplete="name" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Email</span>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Password</span>
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />
          <span className="text-xs text-muted-foreground">
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

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="text-foreground font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
